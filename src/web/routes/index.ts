import express from 'express';
import axios from 'axios';
import path from 'path';
import { AES, enc } from 'crypto-js';
import UserModel from '#models/user.model';
import { RoleAssignmentService } from '../../services/roleAssignmentService';
import { OAuthService, OAuthSource } from '../../services/oauthService';
import { Snowflake } from 'discord.js';

const router = express.Router();

/**
 * Shared authorization logic for both primary and fallback OAuth flows
 */
async function handleAuthorization(req: express.Request, res: express.Response, source: OAuthSource) {
    const { code, state } = req.query;

    if (!code || !state || typeof state !== 'string' || typeof code !== 'string') {
        return res.send('Error: The link you followed appears to be malformed. Try verifying again.');
    }
    if (!process.env.AES_PASSPHRASE || !OAuthService.validateEnvironmentVariables(source)) {
        return res.send(
            `The bot configuration was not setup correctly. Please notify the support server (https://discord.gg/KHByMmrrw2) so that it can be fixed.`
        );
    }

    let discordId: string;
    try {
        const decodedUID = AES.decrypt(req.params.encodedId.replace(/_/g, '/').replace(/-/g, '+'), process.env.AES_PASSPHRASE).toString(
            enc.Utf8
        );
        if (!decodedUID.endsWith('-sebot')) throw new Error('Malformed verification link');

        discordId = decodedUID.replace('-sebot', '');
        if (!discordId.match(/^\d+$/)) throw new Error('Malformed verification link');
    } catch (e) {
        return res.send('Error: The link you followed appears to be malformed. Try requesting a new verification link.');
    }

    try {
        const { access_token, refresh_token } = await OAuthService.exchangeCodeForToken(code, source);
        const { userPrincipalName, givenName, surname, department, createdDateTime } = await OAuthService.fetchUserData(access_token);

        if (!userPrincipalName || !userPrincipalName.endsWith('@uwaterloo.ca')) {
            return res.send(
                'Error: The Microsoft account email you authenticated with does not end with @uwaterloo.ca. Please ensure you are logging in with the correct account.'
            );
        }
        const uwid = userPrincipalName.replace('@uwaterloo.ca', '');

        const existingUser = await UserModel.findOne({ discordId: discordId, department: { $ne: null } });
        const oldDepartment = existingUser?.department;

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
                    authSource: source,
                },
            },
            { upsert: true }
        );

        const roleAssignmentService = new RoleAssignmentService(discordId as Snowflake);
        await roleAssignmentService.assignAllRoles(req.client, oldDepartment);

        res.send("You've been verified successfully! You can close this window and return to Discord.");
    } catch (e: unknown) {
        if (axios.isAxiosError(e)) {
            const sourceLabel = source === 'uw' ? 'using UW OAuth flow' : 'using common OAuth flow';
            req.log.warn(
                `Axios Error: Graph API responded with status code ${e.response?.status} and error object ${JSON.stringify(
                    e.response?.data
                )} for user ${discordId} ${sourceLabel}.`
            );
        } else if (e instanceof Error) {
            req.log.error(e, e.message);
        }

        res.send(
            `We ran into an error verifying your account. Please try again later or join the support server for help: https://discord.gg/KHByMmrrw2`
        );
    }
}

router.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'src', 'web', 'public', 'index.html'));
});

router.get('/authorize', async (req, res) => {
    await handleAuthorization(req, res, 'uw');
});

router.get('/common/authorize', async (req, res) => {
    await handleAuthorization(req, res, 'common');
});

export default router;
