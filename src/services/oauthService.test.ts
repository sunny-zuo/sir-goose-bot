import { OAuthService } from './oauthService';

// Mock axios
jest.mock('axios');

// Mock logger to prevent console output during tests
jest.mock('#util/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));

describe('OAuthService', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetAllMocks();
        process.env = { ...originalEnv };

        // Set up default environment variables
        process.env.CLIENT_ID = 'uw-client-id';
        process.env.CLIENT_SECRET = 'uw-client-secret';
        process.env.TENANT_ID = 'uw-tenant-id';
        process.env.SERVER_URI = 'https://example.com';

        process.env.CLIENT_ID_COMMON = 'fallback-client-id';
        process.env.CLIENT_SECRET_COMMON = 'fallback-client-secret';
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('getCredentials', () => {
        it('should return UW credentials when source is UW', () => {
            const credentials = OAuthService.getCredentials('uw');

            expect(credentials).toEqual({
                clientId: 'uw-client-id',
                clientSecret: 'uw-client-secret',
                tenantId: 'uw-tenant-id',
                redirectUri: `https://example.com/authorize`,
            });
        });

        it('should return common credentials when source is common', () => {
            const credentials = OAuthService.getCredentials('common');

            expect(credentials).toEqual({
                clientId: 'fallback-client-id',
                clientSecret: 'fallback-client-secret',
                tenantId: 'uw-tenant-id',
                redirectUri: `https://example.com/common/authorize`,
            });
        });

        it('should return UW credentials when source is UW even if common credentials are missing', () => {
            delete process.env.CLIENT_ID_COMMON;
            delete process.env.CLIENT_SECRET_COMMON;

            const credentials = OAuthService.getCredentials('uw');

            expect(credentials).toEqual({
                clientId: 'uw-client-id',
                clientSecret: 'uw-client-secret',
                tenantId: 'uw-tenant-id',
                redirectUri: `https://example.com/authorize`,
            });
        });

        it('should throw error when uw environment variables are missing', () => {
            delete process.env.CLIENT_ID;

            expect(() => OAuthService.getCredentials('uw')).toThrow();
        });

        it('should throw error when common environment variables are missing', () => {
            delete process.env.CLIENT_ID_COMMON;

            expect(() => OAuthService.getCredentials('common')).toThrow();
        });
    });

    describe('validateEnvironmentVariables', () => {
        it('should return true when all primary variables are present', () => {
            const isValid = OAuthService.validateEnvironmentVariables('uw');

            expect(isValid).toBe(true);
        });

        it('should return false when primary variables are missing', () => {
            delete process.env.CLIENT_ID;

            const isValid = OAuthService.validateEnvironmentVariables('uw');

            expect(isValid).toBe(false);
        });

        it('should return true when all fallback variables are present', () => {
            const isValid = OAuthService.validateEnvironmentVariables('common');

            expect(isValid).toBe(true);
        });

        it('should return false when fallback variables are missing', () => {
            delete process.env.CLIENT_ID_COMMON;

            const isValid = OAuthService.validateEnvironmentVariables('common');

            expect(isValid).toBe(false);
        });
    });

    describe('getAuthorizationUrl', () => {
        it('should construct correct URL with primary credentials', () => {
            const url = OAuthService.getAuthorizationUrl('test-state', 'uw');

            expect(url).toContain('https://login.microsoftonline.com/uw-tenant-id/oauth2/v2.0/authorize');
            expect(url).toContain('client_id=uw-client-id');
            expect(url).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fauthorize');
            expect(url).toContain('state=test-state');
        });

        it('should construct correct URL with fallback credentials', () => {
            const url = OAuthService.getAuthorizationUrl('test-state', 'common');

            expect(url).toContain('https://login.microsoftonline.com/uw-tenant-id/oauth2/v2.0/authorize');
            expect(url).toContain('client_id=fallback-client-id');
            expect(url).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fcommon%2Fauthorize');
            expect(url).toContain('state=test-state');
        });
    });
});
