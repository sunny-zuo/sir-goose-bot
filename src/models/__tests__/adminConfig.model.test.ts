import { connect, connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import AdminConfigModel, { AdminConfigEntry } from '../adminConfig.model';

describe('AdminConfig Model', () => {
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
        await AdminConfigModel.deleteMany({});
    });

    describe('Schema Validation', () => {
        it('should create a valid AdminConfig with empty configs', async () => {
            const adminConfig = new AdminConfigModel({
                configs: new Map(),
            });

            const savedConfig = await adminConfig.save();
            expect(savedConfig._id).toBeDefined();
            expect(savedConfig.configs).toBeInstanceOf(Map);
            expect(savedConfig.configs.size).toBe(0);
            expect(savedConfig.createdAt).toBeDefined();
            expect(savedConfig.updatedAt).toBeDefined();
        });

        it('should create a valid AdminConfig with configuration entries', async () => {
            const configEntry: AdminConfigEntry = {
                value: 'test-value',
                comment: 'Test configuration',
                updatedAt: new Date(),
            };

            const adminConfig = new AdminConfigModel({
                configs: new Map([['test-key', configEntry]]),
            });

            const savedConfig = await adminConfig.save();
            expect(savedConfig.configs.get('test-key')).toEqual(
                expect.objectContaining({
                    value: 'test-value',
                    comment: 'Test configuration',
                })
            );
        });

        it('should require value field in config entries', async () => {
            const adminConfig = new AdminConfigModel({
                configs: new Map([['test-key', { comment: 'No value' }]]),
            });

            await expect(adminConfig.save()).rejects.toThrow();
        });

        it('should require non blank value field in config entries', async () => {
            const adminConfig = new AdminConfigModel({
                configs: new Map([['test-key', { value: '', comment: 'No value' }]]),
            });

            await expect(adminConfig.save()).rejects.toThrow();
        });

        it('should allow config entries without comment', async () => {
            const configEntry: AdminConfigEntry = {
                value: 'test-value',
                updatedAt: new Date(),
            };

            const adminConfig = new AdminConfigModel({
                configs: new Map([['test-key', configEntry]]),
            });

            const savedConfig = await adminConfig.save();
            expect(savedConfig.configs.get('test-key')?.value).toBe('test-value');
            expect(savedConfig.configs.get('test-key')?.comment).toBeUndefined();
        });

        it('should automatically set updatedAt if not provided', async () => {
            const adminConfig = new AdminConfigModel({
                configs: new Map([['test-key', { value: 'test-value' }]]),
            });

            const savedConfig = await adminConfig.save();
            const configEntry = savedConfig.configs.get('test-key');
            expect(configEntry?.updatedAt).toBeDefined();
            expect(configEntry?.updatedAt).toBeInstanceOf(Date);
        });
    });

    describe('Map Operations', () => {
        it('should support multiple configuration entries', async () => {
            const configs = new Map([
                ['key1', { value: 'value1', comment: 'First config', updatedAt: new Date() }],
                ['key2', { value: 'value2', comment: 'Second config', updatedAt: new Date() }],
                ['key3', { value: 'value3', updatedAt: new Date() }],
            ]);

            const adminConfig = new AdminConfigModel({ configs });
            const savedConfig = await adminConfig.save();

            expect(savedConfig.configs.size).toBe(3);
            expect(savedConfig.configs.get('key1')?.value).toBe('value1');
            expect(savedConfig.configs.get('key2')?.value).toBe('value2');
            expect(savedConfig.configs.get('key3')?.value).toBe('value3');
            expect(savedConfig.configs.get('key3')?.comment).toBeUndefined();
        });

        it('should handle special characters in keys and values', async () => {
            const specialKey = 'key-with_special_chars@123'; // Remove dots as they're not supported in Mongoose Maps
            const specialValue = 'value with spaces, symbols: !@#$%^&*()';

            const adminConfig = new AdminConfigModel();
            adminConfig.configs.set(specialKey, {
                value: specialValue,
                comment: 'Special characters test',
                updatedAt: new Date(),
            });

            const savedConfig = await adminConfig.save();
            expect(savedConfig.configs.get(specialKey)?.value).toBe(specialValue);
        });
    });

    describe('Database Operations', () => {
        it('should update existing configuration entries', async () => {
            // Create initial config
            const adminConfig = new AdminConfigModel({
                configs: new Map([
                    [
                        'test-key',
                        {
                            value: 'initial-value',
                            comment: 'Initial comment',
                            updatedAt: new Date(),
                        },
                    ],
                ]),
            });
            const savedConfig = await adminConfig.save();

            // Update the config
            savedConfig.configs.set('test-key', {
                value: 'updated-value',
                comment: 'Updated comment',
                updatedAt: new Date(),
            });
            const updatedConfig = await savedConfig.save();

            expect(updatedConfig.configs.get('test-key')?.value).toBe('updated-value');
            expect(updatedConfig.configs.get('test-key')?.comment).toBe('Updated comment');
        });

        it('should add new configuration entries to existing document', async () => {
            // Create initial config
            const adminConfig = new AdminConfigModel({
                configs: new Map([
                    [
                        'key1',
                        {
                            value: 'value1',
                            updatedAt: new Date(),
                        },
                    ],
                ]),
            });
            const savedConfig = await adminConfig.save();

            // Add new config
            savedConfig.configs.set('key2', {
                value: 'value2',
                comment: 'New config',
                updatedAt: new Date(),
            });
            const updatedConfig = await savedConfig.save();

            expect(updatedConfig.configs.size).toBe(2);
            expect(updatedConfig.configs.get('key1')?.value).toBe('value1');
            expect(updatedConfig.configs.get('key2')?.value).toBe('value2');
        });

        it('should find and retrieve configuration documents', async () => {
            const adminConfig = new AdminConfigModel({
                configs: new Map([
                    [
                        'find-test',
                        {
                            value: 'findable-value',
                            updatedAt: new Date(),
                        },
                    ],
                ]),
            });
            await adminConfig.save();

            const foundConfig = await AdminConfigModel.findOne({});
            expect(foundConfig).toBeTruthy();
            expect(foundConfig?.configs.get('find-test')?.value).toBe('findable-value');
        });
    });

    describe('Post-save Hook', () => {
        it('should execute post-save hook without errors', async () => {
            // Since the cache is not implemented yet, we just verify the hook doesn't throw
            const adminConfig = new AdminConfigModel({
                configs: new Map([
                    [
                        'hook-test',
                        {
                            value: 'hook-value',
                            updatedAt: new Date(),
                        },
                    ],
                ]),
            });

            // This should not throw an error even though cache update is not implemented
            await expect(adminConfig.save()).resolves.toBeTruthy();
        });
    });

    describe('Edge Cases', () => {
        it('should handle very long configuration values', async () => {
            const longValue = 'a'.repeat(10000);
            const adminConfig = new AdminConfigModel({
                configs: new Map([
                    [
                        'long-value-key',
                        {
                            value: longValue,
                            updatedAt: new Date(),
                        },
                    ],
                ]),
            });

            const savedConfig = await adminConfig.save();
            expect(savedConfig.configs.get('long-value-key')?.value).toBe(longValue);
        });

        it('should handle unicode characters in values and comments', async () => {
            const unicodeValue = '🚀 Unicode test with émojis and spëcial chars 中文';
            const unicodeComment = 'Comment with émojis 🎉 and spëcial chars';

            const adminConfig = new AdminConfigModel({
                configs: new Map([
                    [
                        'unicode-key',
                        {
                            value: unicodeValue,
                            comment: unicodeComment,
                            updatedAt: new Date(),
                        },
                    ],
                ]),
            });

            const savedConfig = await adminConfig.save();
            expect(savedConfig.configs.get('unicode-key')?.value).toBe(unicodeValue);
            expect(savedConfig.configs.get('unicode-key')?.comment).toBe(unicodeComment);
        });

        it('should handle numeric string values', async () => {
            const numericValue = '12345.67';
            const adminConfig = new AdminConfigModel({
                configs: new Map([
                    [
                        'numeric-key',
                        {
                            value: numericValue,
                            updatedAt: new Date(),
                        },
                    ],
                ]),
            });

            const savedConfig = await adminConfig.save();
            expect(savedConfig.configs.get('numeric-key')?.value).toBe(numericValue);
            expect(typeof savedConfig.configs.get('numeric-key')?.value).toBe('string');
        });
    });
});
