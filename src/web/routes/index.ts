import express from 'express';
import axios from 'axios';
import path from 'path';
import { AES, enc } from 'crypto-js';
import { URLSearchParams } from 'url';
import UserModel from '../../models/user.model';
import { RoleAssignmentService } from '../../services/roleAssignmentService';
import { Snowflake } from 'discord.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'src', 'web', 'public', 'index.html'));
});

router.get('/authorize', async (req, res) => {
    const { code, state } = req.query;

    if (!code || !state || typeof state !== 'string' || typeof code !== 'string') {
        res.send('Error: The link you followed appears to be malformed. Try verifying again.');
        return;
    }
    if (!process.env.AES_PASSPHRASE || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.SERVER_URI) {
        res.send(`The bot configuration was not setup correctly. Please notify ${process.env.OWNER_DISCORD_USERNAME} so they can fix it.`);
        return;
    }

    const decodedUID = AES.decrypt(state.replace(/_/g, '/').replace(/-/g, '+'), process.env.AES_PASSPHRASE).toString(enc.Utf8);
    if (!decodedUID.endsWith('-sebot')) {
        res.send('Error: The link you followed appears to be malformed. Try verifying again.');
        return;
    }
    const discordId = decodedUID.replace('-sebot', '');

    const getTokenParams = new URLSearchParams();
    getTokenParams.append('client_id', process.env.CLIENT_ID);
    getTokenParams.append('scope', 'user.read offline_access');
    getTokenParams.append('redirect_uri', `${process.env.SERVER_URI}/authorize`);
    getTokenParams.append('grant_type', 'authorization_code');
    getTokenParams.append('client_secret', process.env.CLIENT_SECRET);
    getTokenParams.append('code', code);

    try {
        const getTokenRes = await axios.post(
            `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`,
            getTokenParams
        );

        const { access_token, refresh_token } = getTokenRes.data;

        const userDataReq = await axios.get(
            `https://graph.microsoft.com/v1.0/me?$select=department,createdDateTime,userPrincipalName,givenName,surname`,
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }
        );

        const { userPrincipalName, givenName, surname, department, createdDateTime } = userDataReq.data;
        const uwid = userPrincipalName.replace('@uwaterloo.ca', '');

        await UserModel.updateOne(
            { discordId: discordId },
            {
                $set: {
                    discordId: discordId,
                    verified: true,
                    verifiedAt: new Date(),
                    uwid: uwid,
                    givenName: givenName,
                    surname: surname,
                    department: department,
                    o365CreatedDate: new Date(createdDateTime),
                    refreshToken: refresh_token,
                },
            },
            { upsert: true }
        );

        const roleAssignmentService = new RoleAssignmentService(req.client, discordId as Snowflake);
        await roleAssignmentService.assignAllRoles();

        res.send("You've been verified successfully! You can close this window and return to Discord.");
    } catch (e: unknown) {
        if (axios.isAxiosError(e)) {
            req.client.log.error(
                `Axios Error: Graph API responded with status code ${e.response?.status} and error object ${JSON.stringify(
                    e.response?.data
                )} for user ${discordId}.`
            );
        } else if (e instanceof Error) {
            req.client.log.error(e.message, e.stack);
        }

        res.send(
            `We ran into an error verifying your account. Please try again later or message ${process.env.OWNER_DISCORD_USERNAME} on Discord for help.`
        );
    }
});

export default router;
