import { AES, enc } from 'crypto-js';
import express from 'express';
import UserModel from '#models/user.model';
import { OAuthService, OAuthSource } from '#services/oauthService';
import { AdminConfigCache, FLAGS } from '#util/adminConfigCache';
import { logger } from '#util/logger';

const router = express.Router();

router.get('/:encodedId', async (req, res) => {
    if (!OAuthService.validateEnvironmentVariables('uw') || !process.env.AES_PASSPHRASE) {
        return res.send(
            `The bot configuration was not setup correctly. Please notify the support server (https://discord.gg/KHByMmrrw2) so that it can be fixed.`
        );
    }
    if (!req.params.encodedId) {
        return res.send('Error: The link you followed appears to be malformed. Try requesting a new verification link.');
    }

    let discordId: string;
    try {
        const decodedUID = AES.decrypt(req.params.encodedId.replace(/_/g, '/').replace(/-/g, '+'), process.env.AES_PASSPHRASE).toString(
            enc.Utf8
        );
        if (!decodedUID.endsWith('-sebot')) throw new Error('Malformed verification link');

        discordId = decodedUID.replace('-sebot', '');
        // TODO: check if discord id is numeric (snowflake format) or else throw
    } catch (e) {
        return res.send('Error: The link you followed appears to be malformed. Try requesting a new verification link.');
    }

    await UserModel.updateOne({ discordId: discordId }, { $set: { verifiedClickedAt: new Date() } });
    try {
        let oauthSource: OAuthSource = 'uw';

        // check if we should use the fallback (common) flow,
        // either because it was set globally or for this specific user
        const useFallbackFlow = await AdminConfigCache.getConfig(FLAGS.USE_OAUTH_FALLBACK, 'false');
        if (useFallbackFlow) oauthSource = 'common';
        const forceFallbackFlowUsers = await AdminConfigCache.getConfigAsArray(FLAGS.FORCE_FALLBACK_FLOW_USERS);
        if (forceFallbackFlowUsers.includes(discordId)) oauthSource = 'common';

        // get the redirect URL based on the desired OAuth source
        // after authentication, the user will be redirected to a different URL based on the source:
        // process.env.SERVER_URI/authorize for UW, /common/authorize for common
        const authorizationUrl = OAuthService.getAuthorizationUrl(req.params.encodedId, oauthSource);
        res.redirect(authorizationUrl);
    } catch (e) {
        logger.error(e, 'Error redirecting user to authorization URL');
        res.send(
            `An unexpected error occured. Please try again or notify the support server (https://discord.gg/KHByMmrrw2) if this continues happening.`
        );
        return;
    }
});

export default router;

// https://login.microsoftonline.com/af6992b1-ce00-40cb-9011-ff45a90f5001/oauth2/v2.0/authorize?client_id=e318abaa-1914-4405-986b-40cd603adb86&response_type=code&redirect_uri=http://localhost:3000/generic/authorize&response_mode=query&scope=offline_access%20user.read&state=test`
// https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize?client_id=e318abaa-1914-4405-986b-40cd603adb86&response_type=code&redirect_uri=http://localhost:3000/common/authorize&response_mode=query&scope=offline_access%20user.read&state=test&prompt=select_account
// https://login.microsoftonline.com/723a5a87-f39a-4a22-9247-3fc240c01396/oauth2/v2.0/authorize?client_id=e318abaa-1914-4405-986b-40cd603adb86&response_type=code&redirect_uri=http://localhost:3000/common/authorize&response_mode=query&scope=offline_access%20user.read&state=test&prompt=select_account

// link for other similar bot
// https://login.microsoftonline.com/723a5a87-f39a-4a22-9247-3fc240c01396/oauth2/v2.0/authorize?client_id=1565c008-269f-42d0-99d4-ea1df00fd174&scope=user.read%20openid%20profile%20offline_access&redirect_uri=https%3A%2F%2Fuwdiscord.gibstick.net%2Fredirect&client-request-id=3fbd26c8-a36f-460f-a18b-96655b5fb38f&response_mode=query&response_type=code&x-client-SKU=msal.js.node&x-client-VER=1.14.6&x-client-OS=linux&x-client-CPU=x64&client_info=1&prompt=select_account
