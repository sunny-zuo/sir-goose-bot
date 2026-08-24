import axios from 'axios';
import { URLSearchParams } from 'url';
import { logger } from '#util/logger';

export interface OAuthCredentials {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    redirectUri: string;
}

export interface OAuthTokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

export interface UserData {
    userPrincipalName: string;
    givenName: string;
    surname: string;
    department: string;
    createdDateTime: string;
}

export type OAuthSource = 'uw' | 'common'; // uw specific app and generic app respectively

export class OAuthService {
    /**
     * Gets the active OAuth credentials based on AdminConfig flag and request source
     * @param source The source of the request ('uw' for /authorize, 'common' for /common/authorize)
     * @returns OAuth credentials to use
     */
    static getCredentials(source: OAuthSource): OAuthCredentials {
        switch (source) {
            case 'uw':
                return this.getPrimaryCredentials();
            case 'common':
                return this.getFallbackCredentials();
        }
    }

    /**
     * Gets primary OAuth credentials from environment variables
     * @returns Primary OAuth credentials
     */
    private static getPrimaryCredentials(): OAuthCredentials {
        const clientId = process.env.CLIENT_ID;
        const clientSecret = process.env.CLIENT_SECRET;
        const tenantId = process.env.TENANT_ID;
        const serverUri = process.env.SERVER_URI;

        if (!clientId || !clientSecret || !tenantId || !serverUri) {
            throw new Error('Missing required primary OAuth environment variables: CLIENT_ID, CLIENT_SECRET, TENANT_ID, SERVER_URI');
        }

        return {
            clientId,
            clientSecret,
            tenantId,
            redirectUri: `${serverUri}/authorize`,
        };
    }

    /**
     * Gets fallback OAuth credentials from environment variables
     * @returns Fallback OAuth credentials
     */
    private static getFallbackCredentials(): OAuthCredentials {
        const clientId = process.env.CLIENT_ID_COMMON;
        const clientSecret = process.env.CLIENT_SECRET_COMMON;
        const tenantId = process.env.TENANT_ID; // use the same tenant as we only want to auth users in the UW tenant
        const serverUri = process.env.SERVER_URI;

        if (!clientId || !clientSecret || !tenantId || !serverUri) {
            throw new Error(
                'Missing required fallback OAuth environment variables: CLIENT_ID_COMMON, CLIENT_SECRET_COMMON, TENANT_ID, SERVER_URI'
            );
        }

        return {
            clientId,
            clientSecret,
            tenantId,
            redirectUri: `${serverUri}/common/authorize`,
        };
    }

    /**
     * Validates that required environment variables are present for the selected configuration
     * @param source The OAuth source to validate
     * @returns true if all required variables are present
     */
    static validateEnvironmentVariables(source: OAuthSource): boolean {
        try {
            this.getCredentials(source);
            return true;
        } catch (error) {
            logger.error(error, `OAuth environment validation failed for source: ${source}`);
            return false;
        }
    }

    /**
     * Constructs the Microsoft OAuth authorization URL for users to grant permissions to Sir Goose
     * @param state The state parameter for OAuth flow
     * @param source The OAuth source to use
     * @returns The authorization URL
     */
    static getAuthorizationUrl(state: string, source: OAuthSource = 'uw'): string {
        const credentials = this.getCredentials(source);

        const params = new URLSearchParams({
            client_id: credentials.clientId,
            response_type: 'code',
            redirect_uri: credentials.redirectUri,
            response_mode: 'query',
            scope: 'offline_access user.read', // read the user's profile + possibly refresh in the future
            state: state, // used to identify the user
            prompt: 'select_account', // ask the user to explicitly select their account, even if they've logged in before
        });

        return `https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
    }

    /**
     * Exchanges authorization code for access token
     * @param code The authorization code from OAuth callback
     * @param source The OAuth source to use
     * @returns Token response containing access_token and refresh_token
     */
    static async exchangeCodeForToken(code: string, source: OAuthSource = 'uw'): Promise<OAuthTokenResponse> {
        const credentials = this.getCredentials(source);

        const tokenParams = new URLSearchParams();
        tokenParams.append('client_id', credentials.clientId);
        tokenParams.append('scope', 'user.read offline_access');
        tokenParams.append('redirect_uri', credentials.redirectUri);
        tokenParams.append('grant_type', 'authorization_code');
        tokenParams.append('client_secret', credentials.clientSecret);
        tokenParams.append('code', code);

        try {
            const response = await axios.post(`https://login.microsoftonline.com/${credentials.tenantId}/oauth2/v2.0/token`, tokenParams, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            return response.data;
        } catch (error) {
            logger.error(error, `Failed to exchange code for token using ${source} credentials`);
            throw error;
        }
    }

    /**
     * Fetches user data from Microsoft Graph API
     * @param accessToken The access token to use for the request
     * @returns User data from Microsoft Graph
     */
    static async fetchUserData(accessToken: string): Promise<UserData> {
        try {
            const response = await axios.get(
                'https://graph.microsoft.com/v1.0/me?$select=department,createdDateTime,userPrincipalName,givenName,surname',
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            return response.data;
        } catch (error) {
            logger.error(error, 'Failed to fetch user data from Microsoft Graph');
            throw error;
        }
    }
}
