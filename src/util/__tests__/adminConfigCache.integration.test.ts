import { AdminConfigCache } from '../adminConfigCache';
import AdminConfigModel from '#models/adminConfig.model';
import { connect, disconnect } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Integration tests that use real database operations
describe('AdminConfigCache Integration', () => {
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await connect(mongoUri);
    });

    afterAll(async () => {
        // Clean up and disconnect
        await AdminConfigModel.deleteMany({});
        await disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Clear database and cache before each test
        await AdminConfigModel.deleteMany({});
        await AdminConfigCache.reloadCache();
    });

    it('should persist configs to database and load from cache', async () => {
        // Set a config through cache
        await AdminConfigCache.setConfig('testKey', 'testValue', 'test comment');

        // Verify it's in the database
        const dbConfig = await AdminConfigModel.findOne();
        expect(dbConfig).toBeTruthy();
        expect(dbConfig!.configs.get('testKey')).toMatchObject({
            value: 'testValue',
            comment: 'test comment',
        });

        // Reload cache and verify it loads from database
        await AdminConfigCache.reloadCache();
        const cachedValue = await AdminConfigCache.getConfig('testKey');
        expect(cachedValue).toBe('testValue');
    });

    it('should handle post-save hook cache updates', async () => {
        // Create config directly in database
        const configMap = new Map();
        configMap.set('hookTest', {
            value: 'hookValue',
            comment: 'created via model',
            updatedAt: new Date(),
        });

        const adminConfig = new AdminConfigModel({ configs: configMap });
        await adminConfig.save();

        // Cache should be updated via post-save hook
        const cachedValue = await AdminConfigCache.getConfig('hookTest');
        expect(cachedValue).toBe('hookValue');
    });

    it('should maintain consistency between cache and database', async () => {
        // Set multiple configs
        await AdminConfigCache.setConfig('key1', 'value1');
        await AdminConfigCache.setConfig('key2', 'value2', 'comment2');

        // Delete one config
        await AdminConfigCache.deleteConfig('key1');

        // Verify database state
        const dbConfig = await AdminConfigModel.findOne();
        expect(dbConfig!.configs.has('key1')).toBe(false);
        expect(dbConfig!.configs.has('key2')).toBe(true);
        expect(dbConfig!.configs.get('key2')!.value).toBe('value2');

        // Verify cache state
        const allConfigs = await AdminConfigCache.getAllConfigs();
        expect(allConfigs).not.toHaveProperty('key1');
        expect(allConfigs.key2.value).toBe('value2');
        expect(allConfigs.key2.comment).toBe('comment2');
    });
});
