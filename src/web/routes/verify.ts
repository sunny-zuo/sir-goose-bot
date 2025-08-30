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
