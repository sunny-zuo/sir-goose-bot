import { connect, connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import GuildConfigModel from '../guildConfig.model';
import { VerificationRules, UnverifiedConfig, RoleData } from '#types/Verification';

describe('GuildConfig Model', () => {
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await connect(mongoUri);
    });

    afterAll(async () => {
        await connection.dropDatabase();
        await connection.close();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await GuildConfigModel.deleteMany({});
    });

    describe('Basic Schema Validation', () => {
        it('should create a valid GuildConfig with minimal required fields', async () => {
            const guildConfig = new GuildConfigModel({
                guildId: '123456789012345678',
            });

            const savedConfig = await guildConfig.save();
            expect(savedConfig._id).toBeDefined();
            expect(savedConfig.guildId).toBe('123456789012345678');
            expect(savedConfig.prefix).toBe('$');
            expect(savedConfig.enableModlog).toBe(false);
            expect(savedConfig.enablePins).toBe(false);
            expect(savedConfig.enableVerification).toBe(false);
            expect(savedConfig.createdAt).toBeDefined();
            expect(savedConfig.updatedAt).toBeDefined();
        });

        it('should require guildId field', async () => {
            const guildConfig = new GuildConfigModel({});

            await expect(guildConfig.save()).rejects.toThrow();
        });

        it('should create a valid GuildConfig with all fields', async () => {
            const guildConfig = new GuildConfigModel({
                guildId: '123456789012345678',
                prefix: '$',
                enableModlog: true,
                modlogChannelId: '987654321098765432',
                enablePins: true,
                enableVerification: true,
            });

            const savedConfig = await guildConfig.save();
            expect(savedConfig.guildId).toBe('123456789012345678');
            expect(savedConfig.prefix).toBe('$');
            expect(savedConfig.enableModlog).toBe(true);
            expect(savedConfig.modlogChannelId).toBe('987654321098765432');
            expect(savedConfig.enablePins).toBe(true);
            expect(savedConfig.enableVerification).toBe(true);
        });
    });

    describe('Verification Rules Schema Validation', () => {
        const sampleRoleData: RoleData[] = [
            { name: 'Student', id: '111111111111111111' },
            { name: 'Verified', id: '222222222222222222' },
        ];

        const sampleVerificationRules: VerificationRules = {
            baseYear: 2020,
            rules: [
                {
                    roles: sampleRoleData,
                    department: 'MAT/Mathematics Computer Science',
                    matchType: 'exact',
                    yearMatch: 'exact',
                    year: 2023,
                },
            ],
        };

        it('should create a GuildConfig with verification rules without unverified config', async () => {
            const guildConfig = new GuildConfigModel({
                guildId: '123456789012345678',
                enableVerification: true,
                verificationRules: sampleVerificationRules,
            });

            const savedConfig = await guildConfig.save();
            expect(savedConfig.verificationRules).toBeDefined();
            expect(savedConfig.verificationRules?.baseYear).toBe(2020);
            expect(savedConfig.verificationRules?.rules).toHaveLength(1);
            // mongoose may initialize nested objects, so check for either undefined or empty roles
            expect(
                savedConfig.verificationRules?.unverified === undefined || savedConfig.verificationRules?.unverified?.roles?.length === 0
            ).toBe(true);
        });

        it('should create a GuildConfig with verification rules and unverified config', async () => {
            const unverifiedConfig: UnverifiedConfig = {
                roles: [
                    { name: 'Unverified', id: '333333333333333333' },
                    { name: 'Pending', id: '444444444444444444' },
                ],
            };

            const verificationRulesWithUnverified: VerificationRules = {
                ...sampleVerificationRules,
                unverified: unverifiedConfig,
            };

            const guildConfig = new GuildConfigModel({
                guildId: '123456789012345678',
                enableVerification: true,
                verificationRules: verificationRulesWithUnverified,
            });

            const savedConfig = await guildConfig.save();
            expect(savedConfig.verificationRules?.unverified).toBeDefined();
            expect(savedConfig.verificationRules?.unverified?.roles).toHaveLength(2);
            expect(savedConfig.verificationRules?.unverified?.roles[0].name).toBe('Unverified');
            expect(savedConfig.verificationRules?.unverified?.roles[0].id).toBe('333333333333333333');
            expect(savedConfig.verificationRules?.unverified?.roles[1].name).toBe('Pending');
            expect(savedConfig.verificationRules?.unverified?.roles[1].id).toBe('444444444444444444');
        });

        it('should allow empty unverified roles array', async () => {
            const unverifiedConfig: UnverifiedConfig = {
                roles: [],
            };

            const verificationRulesWithEmptyUnverified: VerificationRules = {
                ...sampleVerificationRules,
                unverified: unverifiedConfig,
            };

            const guildConfig = new GuildConfigModel({
                guildId: '123456789012345678',
                enableVerification: true,
                verificationRules: verificationRulesWithEmptyUnverified,
            });

            const savedConfig = await guildConfig.save();
            expect(savedConfig.verificationRules?.unverified).toBeDefined();
            expect(savedConfig.verificationRules?.unverified?.roles).toHaveLength(0);
        });

        it('should validate role data structure in unverified config', async () => {
            const unverifiedConfig: UnverifiedConfig = {
                roles: [{ name: 'Unverified', id: '333333333333333333' }],
            };

            const verificationRulesWithUnverified: VerificationRules = {
                ...sampleVerificationRules,
                unverified: unverifiedConfig,
            };

            const guildConfig = new GuildConfigModel({
                guildId: '123456789012345678',
                enableVerification: true,
                verificationRules: verificationRulesWithUnverified,
            });

            const savedConfig = await guildConfig.save();
            const unverifiedRole = savedConfig.verificationRules?.unverified?.roles[0];
            expect(unverifiedRole).toBeDefined();
            expect(unverifiedRole?.name).toBe('Unverified');
            expect(unverifiedRole?.id).toBe('333333333333333333');
            expect(typeof unverifiedRole?.name).toBe('string');
            expect(typeof unverifiedRole?.id).toBe('string');
        });
    });

    describe('Unverified Roles Edge Cases', () => {
        it('should handle multiple unverified roles with various names', async () => {
            const unverifiedConfig: UnverifiedConfig = {
                roles: [
                    { name: 'Unverified User', id: '111111111111111111' },
                    { name: 'New Member', id: '222222222222222222' },
                    { name: 'Pending Verification', id: '333333333333333333' },
                    { name: 'Guest', id: '444444444444444444' },
                ],
            };

            const verificationRules: VerificationRules = {
                baseYear: 2020,
                rules: [],
                unverified: unverifiedConfig,
            };

            const guildConfig = new GuildConfigModel({
                guildId: '123456789012345678',
                enableVerification: true,
                verificationRules,
            });

            const savedConfig = await guildConfig.save();
            expect(savedConfig.verificationRules?.unverified?.roles).toHaveLength(4);

            const roleNames = savedConfig.verificationRules?.unverified?.roles.map((role) => role.name);
            expect(roleNames).toContain('Unverified User');
            expect(roleNames).toContain('New Member');
            expect(roleNames).toContain('Pending Verification');
            expect(roleNames).toContain('Guest');
        });

        it('should handle special characters in unverified role names', async () => {
            const unverifiedConfig: UnverifiedConfig = {
                roles: [
                    { name: 'Unverified 🔒', id: '111111111111111111' },
                    { name: 'New-Member_2024', id: '222222222222222222' },
                    { name: 'Pending (Verification)', id: '333333333333333333' },
                ],
            };

            const verificationRules: VerificationRules = {
                baseYear: 2020,
                rules: [],
                unverified: unverifiedConfig,
            };

            const guildConfig = new GuildConfigModel({
                guildId: '123456789012345678',
                enableVerification: true,
                verificationRules,
            });

            const savedConfig = await guildConfig.save();
            expect(savedConfig.verificationRules?.unverified?.roles).toHaveLength(3);
            expect(savedConfig.verificationRules?.unverified?.roles[0].name).toBe('Unverified 🔒');
            expect(savedConfig.verificationRules?.unverified?.roles[1].name).toBe('New-Member_2024');
            expect(savedConfig.verificationRules?.unverified?.roles[2].name).toBe('Pending (Verification)');
        });
    });

    describe('Database Operations with Unverified Roles', () => {
        it('should update existing GuildConfig to add unverified roles', async () => {
            // Create initial config without unverified roles
            const initialConfig = new GuildConfigModel({
                guildId: '123456789012345678',
                enableVerification: true,
                verificationRules: {
                    baseYear: 2020,
                    rules: [],
                },
            });
            const savedConfig = await initialConfig.save();

            // Update to add unverified roles
            savedConfig.verificationRules!.unverified = {
                roles: [{ name: 'Unverified', id: '333333333333333333' }],
            };
            const updatedConfig = await savedConfig.save();

            expect(updatedConfig.verificationRules?.unverified).toBeDefined();
            expect(updatedConfig.verificationRules?.unverified?.roles).toHaveLength(1);
            expect(updatedConfig.verificationRules?.unverified?.roles[0].name).toBe('Unverified');
        });

        it('should update existing unverified roles configuration', async () => {
            // Create initial config with unverified roles
            const initialConfig = new GuildConfigModel({
                guildId: '123456789012345678',
                enableVerification: true,
                verificationRules: {
                    baseYear: 2020,
                    rules: [],
                    unverified: {
                        roles: [{ name: 'Old Unverified', id: '111111111111111111' }],
                    },
                },
            });
            const savedConfig = await initialConfig.save();

            // Update unverified roles
            savedConfig.verificationRules!.unverified!.roles = [
                { name: 'New Unverified', id: '222222222222222222' },
                { name: 'Another Role', id: '333333333333333333' },
            ];
            const updatedConfig = await savedConfig.save();

            expect(updatedConfig.verificationRules?.unverified?.roles).toHaveLength(2);
            expect(updatedConfig.verificationRules?.unverified?.roles[0].name).toBe('New Unverified');
            expect(updatedConfig.verificationRules?.unverified?.roles[1].name).toBe('Another Role');
        });

        it('should find and retrieve GuildConfig with unverified roles', async () => {
            const guildConfig = new GuildConfigModel({
                guildId: '123456789012345678',
                enableVerification: true,
                verificationRules: {
                    baseYear: 2020,
                    rules: [],
                    unverified: {
                        roles: [{ name: 'Findable Role', id: '555555555555555555' }],
                    },
                },
            });
            await guildConfig.save();

            const foundConfig = await GuildConfigModel.findOne({ guildId: '123456789012345678' });
            expect(foundConfig).toBeTruthy();
            expect(foundConfig?.verificationRules?.unverified?.roles).toHaveLength(1);
            expect(foundConfig?.verificationRules?.unverified?.roles[0].name).toBe('Findable Role');
            expect(foundConfig?.verificationRules?.unverified?.roles[0].id).toBe('555555555555555555');
        });
    });

    describe('Post-save Hook Integration', () => {
        it('should execute post-save hook with unverified roles configuration', async () => {
            const guildConfig = new GuildConfigModel({
                guildId: '123456789012345678',
                enableVerification: true,
                verificationRules: {
                    baseYear: 2020,
                    rules: [],
                    unverified: {
                        roles: [{ name: 'Hook Test Role', id: '666666666666666666' }],
                    },
                },
            });

            // This should not throw an error and should trigger the cache update hook
            await expect(guildConfig.save()).resolves.toBeTruthy();
        });
    });
});
