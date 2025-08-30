import { AdminConfigCache } from '../adminConfigCache';
import AdminConfigModel, { AdminConfig } from '#models/adminConfig.model';
import { logger } from '#util/logger';

// Mock the AdminConfigModel and logger
jest.mock('#models/adminConfig.model');
jest.mock('#util/logger');
const mockAdminConfigModel = AdminConfigModel as jest.Mocked<typeof AdminConfigModel>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('AdminConfigCache', () => {
    beforeEach(() => {
        // Reset cache state before each test
        AdminConfigCache._resetCacheForTesting();
        jest.clearAllMocks();
    });

    describe('getConfig', () => {
        it('should return null for non-existent config', async () => {
            mockAdminConfigModel.findOne.mockResolvedValue(null);

            const result = await AdminConfigCache.getConfig('nonexistent');

            expect(result).toBeNull();
        });

        it('should return default for non-existent config when default set', async () => {
            mockAdminConfigModel.findOne.mockResolvedValue(null);

            const result = await AdminConfigCache.getConfig('nonexistent', 'default-value');
            expect(result).toBe('default-value');
        });

        it('should return config value when it exists', async () => {
            const mockConfig: AdminConfig = {
                configs: new Map([['testKey', { value: 'testValue', updatedAt: new Date() }]]),
            };
            mockAdminConfigModel.findOne.mockResolvedValue(mockConfig);

            const result = await AdminConfigCache.getConfig('testKey');
            expect(result).toBe('testValue');

            const result2 = await AdminConfigCache.getConfig('testKey', 'some-unused-default');
            expect(result2).toBe('testValue');
        });

        it('should load from database when cache is empty', async () => {
            const mockConfig: AdminConfig = {
                configs: new Map([['key1', { value: 'value1', updatedAt: new Date() }]]),
            };
            mockAdminConfigModel.findOne.mockResolvedValue(mockConfig);

            await AdminConfigCache.getConfig('key1');

            expect(mockAdminConfigModel.findOne).toHaveBeenCalledTimes(1);
        });

        it('should use cache on subsequent calls', async () => {
            const mockConfig: AdminConfig = {
                configs: new Map([['key1', { value: 'value1', updatedAt: new Date() }]]),
            };
            mockAdminConfigModel.findOne.mockResolvedValue(mockConfig);

            await AdminConfigCache.getConfig('key1');
            await AdminConfigCache.getConfig('key1');

            expect(mockAdminConfigModel.findOne).toHaveBeenCalledTimes(1);
        });

        it('should handle database errors gracefully', async () => {
            mockAdminConfigModel.findOne.mockRejectedValue(new Error('Database error'));

            const result = await AdminConfigCache.getConfig('testKey');

            expect(result).toBeNull();
            expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error), 'Failed to load admin configs from database');
        });
    });

    describe('getConfigAsArray', () => {
        it('should return empty array for non-existent config', async () => {
            mockAdminConfigModel.findOne.mockResolvedValue(null);

            const result = await AdminConfigCache.getConfigAsArray('nonexistent');

            expect(result).toEqual([]);
        });

        it('should return empty array for empty string config', async () => {
            const mockConfig: AdminConfig = {
                configs: new Map([['emptyKey', { value: '', updatedAt: new Date() }]]),
            };
            mockAdminConfigModel.findOne.mockResolvedValue(mockConfig);

            const result = await AdminConfigCache.getConfigAsArray('emptyKey');

            expect(result).toEqual([]);
        });

        it('should parse single value correctly', async () => {
            const mockConfig: AdminConfig = {
                configs: new Map([['singleKey', { value: 'value1', updatedAt: new Date() }]]),
            };
            mockAdminConfigModel.findOne.mockResolvedValue(mockConfig);

            const result = await AdminConfigCache.getConfigAsArray('singleKey');

            expect(result).toEqual(['value1']);
        });

        it('should parse comma-separated values correctly', async () => {
            const mockConfig: AdminConfig = {
                configs: new Map([['multiKey', { value: 'value1,value2,value3', updatedAt: new Date() }]]),
            };
            mockAdminConfigModel.findOne.mockResolvedValue(mockConfig);

            const result = await AdminConfigCache.getConfigAsArray('multiKey');

            expect(result).toEqual(['value1', 'value2', 'value3']);
        });

        it('should trim whitespace from values', async () => {
            const mockConfig: AdminConfig = {
                configs: new Map([['spacedKey', { value: ' value1 , value2 ,  value3  ', updatedAt: new Date() }]]),
            };
            mockAdminConfigModel.findOne.mockResolvedValue(mockConfig);

            const result = await AdminConfigCache.getConfigAsArray('spacedKey');

            expect(result).toEqual(['value1', 'value2', 'value3']);
        });

        it('should filter out empty values after trimming', async () => {
            const mockConfig: AdminConfig = {
                configs: new Map([['mixedKey', { value: 'value1,,value2,   ,value3,', updatedAt: new Date() }]]),
            };
            mockAdminConfigModel.findOne.mockResolvedValue(mockConfig);

            const result = await AdminConfigCache.getConfigAsArray('mixedKey');

            expect(result).toEqual(['value1', 'value2', 'value3']);
        });

        it('should handle values with only commas and spaces', async () => {
            const mockConfig: AdminConfig = {
                configs: new Map([['commasOnly', { value: ' , , ,  ', updatedAt: new Date() }]]),
            };
            mockAdminConfigModel.findOne.mockResolvedValue(mockConfig);

            const result = await AdminConfigCache.getConfigAsArray('commasOnly');

            expect(result).toEqual([]);
        });

        it('should handle guild IDs correctly (real-world use case)', async () => {
            const mockConfig: AdminConfig = {
                configs: new Map([
                    ['guildIds', { value: '123456789012345678,987654321098765432,111222333444555666', updatedAt: new Date() }],
                ]),
            };
            mockAdminConfigModel.findOne.mockResolvedValue(mockConfig);

            const result = await AdminConfigCache.getConfigAsArray('guildIds');

            expect(result).toEqual(['123456789012345678', '987654321098765432', '111222333444555666']);
        });

        it('should handle user IDs correctly (real-world use case)', async () => {
            const mockConfig: AdminConfig = {
                configs: new Map([
                    ['userIds', { value: '100200300400500600, 200300400500600700 ,300400500600700800', updatedAt: new Date() }],
                ]),
            };
            mockAdminConfigModel.findOne.mockResolvedValue(mockConfig);

            const result = await AdminConfigCache.getConfigAsArray('userIds');

            expect(result).toEqual(['100200300400500600', '200300400500600700', '300400500600700800']);
        });

        it('should handle database errors gracefully', async () => {
            mockAdminConfigModel.findOne.mockRejectedValue(new Error('Database error'));

            const result = await AdminConfigCache.getConfigAsArray('testKey');

            expect(result).toEqual([]);
            expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error), 'Failed to load admin configs from database');
        });
    });

    describe('getAllConfigs', () => {
        it('should return empty object when no configs exist', async () => {
            mockAdminConfigModel.findOne.mockResolvedValue(null);

            const result = await AdminConfigCache.getAllConfigs();

            expect(result).toEqual({});
        });

        it('should return all configs with metadata', async () => {
            const date1 = new Date('2023-01-01');
            const date2 = new Date('2023-01-02');
            const mockConfig: AdminConfig = {
                configs: new Map([
                    ['key1', { value: 'value1', comment: 'comment1', updatedAt: date1 }],
                    ['key2', { value: 'value2', updatedAt: date2 }],
                ]),
            };
            mockAdminConfigModel.findOne.mockResolvedValue(mockConfig);

            const result = await AdminConfigCache.getAllConfigs();

            expect(result).toEqual({
                key1: { value: 'value1', comment: 'comment1', updatedAt: date1 },
                key2: { value: 'value2', updatedAt: date2 },
            });
        });
    });

    describe('setConfig', () => {
        it('should create new config entry', async () => {
            const mockResult: AdminConfig = { configs: new Map() };
            mockAdminConfigModel.findOneAndUpdate.mockResolvedValue(mockResult);

            await AdminConfigCache.setConfig('newKey', 'newValue', 'test comment');

            expect(mockAdminConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
                {},
                { configs: expect.any(Map) },
                { upsert: true, new: true }
            );
        });

        it('should update existing config entry', async () => {
            // Pre-populate cache
            const mockConfig: AdminConfig = {
                configs: new Map([['existingKey', { value: 'oldValue', updatedAt: new Date() }]]),
            };
            const mockResult: AdminConfig = { configs: new Map() };
            mockAdminConfigModel.findOne.mockResolvedValue(mockConfig);
            mockAdminConfigModel.findOneAndUpdate.mockResolvedValue(mockResult);

            await AdminConfigCache.getConfig('existingKey'); // Load cache
            await AdminConfigCache.setConfig('existingKey', 'newValue');

            const result = await AdminConfigCache.getConfig('existingKey');
            expect(result).toBe('newValue');
        });

        it('should handle database update errors', async () => {
            mockAdminConfigModel.findOneAndUpdate.mockRejectedValue(new Error('Database error'));

            await expect(AdminConfigCache.setConfig('key', 'value')).rejects.toThrow('Database error');
            expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error), 'Failed to update admin configs in database');
        });

        it('should set config with comment', async () => {
            const mockResult: AdminConfig = { configs: new Map() };
            mockAdminConfigModel.findOneAndUpdate.mockResolvedValue(mockResult);

            await AdminConfigCache.setConfig('key', 'value', 'test comment');

            const configs = await AdminConfigCache.getAllConfigs();
            expect(configs.key.comment).toBe('test comment');
        });

        it('should set config without comment', async () => {
            const mockResult: AdminConfig = { configs: new Map() };
            mockAdminConfigModel.findOneAndUpdate.mockResolvedValue(mockResult);

            await AdminConfigCache.setConfig('key', 'value');

            const configs = await AdminConfigCache.getAllConfigs();
            expect(configs.key.comment).toBeUndefined();
        });
    });

    describe('deleteConfig', () => {
        it('should remove config from cache and database', async () => {
            // Pre-populate cache
            const mockConfig: AdminConfig = {
                configs: new Map([
                    ['key1', { value: 'value1', updatedAt: new Date() }],
                    ['key2', { value: 'value2', updatedAt: new Date() }],
                ]),
            };
            const mockResult: AdminConfig = { configs: new Map() };
            mockAdminConfigModel.findOne.mockResolvedValue(mockConfig);
            mockAdminConfigModel.findOneAndUpdate.mockResolvedValue(mockResult);

            await AdminConfigCache.getConfig('key1'); // Load cache
            await AdminConfigCache.deleteConfig('key1');

            const result = await AdminConfigCache.getConfig('key1');
            expect(result).toBeNull();

            const allConfigs = await AdminConfigCache.getAllConfigs();
            expect(allConfigs).not.toHaveProperty('key1');
            expect(allConfigs).toHaveProperty('key2');
        });

        it('should handle deletion of non-existent key', async () => {
            const mockResult: AdminConfig = { configs: new Map() };
            mockAdminConfigModel.findOneAndUpdate.mockResolvedValue(mockResult);

            await expect(AdminConfigCache.deleteConfig('nonexistent')).resolves.not.toThrow();
        });
    });

    describe('reloadCache', () => {
        it('should clear cache and reload from database', async () => {
            // Pre-populate cache
            const initialConfig: AdminConfig = {
                configs: new Map([['key1', { value: 'value1', updatedAt: new Date() }]]),
            };
            mockAdminConfigModel.findOne.mockResolvedValueOnce(initialConfig);

            await AdminConfigCache.getConfig('key1'); // Load initial cache

            // Change database response
            const updatedConfig: AdminConfig = {
                configs: new Map([['key2', { value: 'value2', updatedAt: new Date() }]]),
            };
            mockAdminConfigModel.findOne.mockResolvedValueOnce(updatedConfig);

            await AdminConfigCache.reloadCache();

            const result1 = await AdminConfigCache.getConfig('key1');
            const result2 = await AdminConfigCache.getConfig('key2');

            expect(result1).toBeNull();
            expect(result2).toBe('value2');
        });
    });

    describe('updateCache', () => {
        it('should update cache with new admin config data', async () => {
            const adminConfig: AdminConfig = {
                configs: new Map([
                    ['key1', { value: 'value1', updatedAt: new Date() }],
                    ['key2', { value: 'value2', comment: 'comment', updatedAt: new Date() }],
                ]),
            };

            AdminConfigCache.updateCache(adminConfig);

            // Verify cache update by checking if we can retrieve the values
            const value1 = await AdminConfigCache.getConfig('key1');
            const value2 = await AdminConfigCache.getConfig('key2');
            const allConfigs = await AdminConfigCache.getAllConfigs();

            expect(value1).toBe('value1');
            expect(value2).toBe('value2');
            expect(allConfigs.key2.comment).toBe('comment');
        });

        it('should clear cache when configs is empty', async () => {
            // Pre-populate cache by setting a config
            const mockResult: AdminConfig = { configs: new Map() };
            mockAdminConfigModel.findOneAndUpdate.mockResolvedValue(mockResult);
            await AdminConfigCache.setConfig('oldKey', 'oldValue');

            // Verify the config was set
            let result = await AdminConfigCache.getConfig('oldKey');
            expect(result).toBe('oldValue');

            // Now update cache with empty configs
            const adminConfig: AdminConfig = { configs: new Map() };
            AdminConfigCache.updateCache(adminConfig);

            // Mock database to return empty configs for subsequent calls
            const emptyConfig: AdminConfig = { configs: new Map() };
            mockAdminConfigModel.findOne.mockResolvedValue(emptyConfig);

            // Verify cache is cleared by checking that the old key returns null
            result = await AdminConfigCache.getConfig('oldKey');
            expect(result).toBeNull();

            const allConfigs = await AdminConfigCache.getAllConfigs();
            expect(Object.keys(allConfigs)).toHaveLength(0);
        });

        it('should handle undefined configs', async () => {
            // Pre-populate cache to ensure we're testing the clearing behavior
            const mockResult: AdminConfig = { configs: new Map() };
            mockAdminConfigModel.findOneAndUpdate.mockResolvedValue(mockResult);
            await AdminConfigCache.setConfig('testKey', 'testValue');

            // Verify the config was set
            const result = await AdminConfigCache.getConfig('testKey');
            expect(result).toBe('testValue');

            // Update with undefined configs - using Partial to allow missing configs property
            const adminConfig: Partial<AdminConfig> = {};
            expect(() => AdminConfigCache.updateCache(adminConfig as AdminConfig)).not.toThrow();

            // Mock database to return empty configs for subsequent calls
            const emptyConfig: AdminConfig = { configs: new Map() };
            mockAdminConfigModel.findOne.mockResolvedValue(emptyConfig);

            // Verify cache is cleared by checking that getAllConfigs returns empty object
            const allConfigs = await AdminConfigCache.getAllConfigs();
            expect(Object.keys(allConfigs)).toHaveLength(0);
        });
    });

    describe('error handling', () => {
        it('should handle database connection errors during load', async () => {
            mockAdminConfigModel.findOne.mockRejectedValue(new Error('Connection failed'));

            const result = await AdminConfigCache.getConfig('testKey');

            expect(result).toBeNull();
            expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error), 'Failed to load admin configs from database');
        });

        it('should maintain cache consistency on database update failure', async () => {
            mockAdminConfigModel.findOneAndUpdate.mockRejectedValue(new Error('Update failed'));

            await expect(AdminConfigCache.setConfig('key', 'value')).rejects.toThrow();

            // Cache should still contain the value even if database update failed
            const result = await AdminConfigCache.getConfig('key');
            expect(result).toBe('value');

            expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error), 'Failed to update admin configs in database');
        });
    });
});
