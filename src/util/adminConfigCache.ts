import { Collection } from 'discord.js';
import AdminConfigModel, { AdminConfig, AdminConfigEntry } from '#models/adminConfig.model';
import { logger } from '#util/logger';

// known admin config cache flags and their uses
export enum FLAGS {
    // true/false string that controls whether or not to apply guild whitelist for verification overrides
    VERIFY_OVERRIDE_PREVIEW = 'verify-override-preview',
    // comma separated list of guild ids with access to verification overrides
    VERIFY_OVERRIDE_GUILDS = 'verify-override-guilds',
    // true/false string that controls whether imports of unverified rules should be allowed
    ENABLE_UNVERIFIED_RULES = 'enable-unverified-rules',
    // true/false string that controls whether to use fallback OAuth credentials instead of primary
    USE_OAUTH_FALLBACK = 'use-oauth-fallback',
    // comma separated list of user ids that should be given the fallback OAuth flow regardless of other configs
    FORCE_FALLBACK_FLOW_USERS = 'force-fallback-flow-users',
}

export class AdminConfigCache {
    static FLAGS = FLAGS;

    private static _cache = new Collection<string, AdminConfigEntry>();
    private static _isLoaded = false;

    /**
     * Retrieves a single configuration value by key
     * @param key The configuration key to retrieve
     * @param def Optional default value if not found
     * @returns The configuration value as a string, or null if not found
     */
    static async getConfig(key: string): Promise<string | null>;
    static async getConfig(key: string, def?: string): Promise<string>;
    static async getConfig(key: string, def?: string): Promise<string | null> {
        await this.ensureCacheLoaded();

        const entry = this._cache.get(key);
        return entry ? entry.value : def ?? null;
    }

    /**
     * Retrieves a single configuration value by key, and parses a comma separated value into an array
     * @param key The configuration key to retrieve
     * @returns The configuration values as a string array, or an empty array if no values exist
     */
    static async getConfigAsArray(key: string): Promise<string[]> {
        const rawString = await this.getConfig(key, '');
        const parsed = rawString
            .split(',')
            .map((id) => id.trim())
            .filter((id) => id.length > 0);

        return parsed;
    }

    /**
     * Retrieves all configuration entries
     * @returns Record of all configuration entries with their metadata
     */
    static async getAllConfigs(): Promise<Record<string, AdminConfigEntry>> {
        await this.ensureCacheLoaded();

        const configs: Record<string, AdminConfigEntry> = {};
        this._cache.forEach((entry, key) => {
            configs[key] = entry;
        });

        return configs;
    }

    /**
     * Creates or updates a configuration entry
     * @param key The configuration key
     * @param value The configuration value
     * @param comment Optional comment describing the configuration
     */
    static async setConfig(key: string, value: string, comment?: string): Promise<void> {
        const entry: AdminConfigEntry = {
            value,
            comment,
            updatedAt: new Date(),
        };

        this._cache.set(key, entry);
        await this.updateDatabase();
    }

    /**
     * Deletes a configuration entry
     * @param key The configuration key to delete
     */
    static async deleteConfig(key: string): Promise<void> {
        const exists = this._cache.delete(key);
        if (exists) await this.updateDatabase();
    }

    /**
     * Reloads the cache from the database
     */
    static async reloadCache(): Promise<void> {
        this._cache.clear();
        this._isLoaded = false;
        await this.loadFromDatabase();
    }

    /**
     * Updates the cache with new data (used by model post-save hook)
     * @param adminConfig The updated admin config document
     */
    static updateCache(adminConfig: AdminConfig): void {
        this._cache.clear();

        if (adminConfig.configs) {
            adminConfig.configs.forEach((entry, key) => {
                this._cache.set(key, entry);
            });
        }

        this._isLoaded = true;
    }

    /**
     * Ensures the cache is loaded from database if empty
     */
    private static async ensureCacheLoaded(): Promise<void> {
        if (!this._isLoaded) {
            await this.loadFromDatabase();
        }
    }

    /**
     * Loads configuration data from the database into cache
     */
    private static async loadFromDatabase(): Promise<void> {
        try {
            const adminConfig = await AdminConfigModel.findOne();

            if (adminConfig && adminConfig.configs) {
                adminConfig.configs.forEach((entry, key) => {
                    this._cache.set(key, entry);
                });
            }

            this._isLoaded = true;
        } catch (error) {
            logger.error(error, 'Failed to load admin configs from database');
            // keep cache as-is if database load fails
        }
    }

    /**
     * Updates the database with current cache contents
     */
    private static async updateDatabase(): Promise<void> {
        try {
            const configsMap = new Map<string, AdminConfigEntry>();
            this._cache.forEach((entry, key) => {
                configsMap.set(key, entry);
            });

            await AdminConfigModel.findOneAndUpdate({}, { configs: configsMap }, { upsert: true, new: true });
        } catch (error) {
            logger.error(error, 'Failed to update admin configs in database');
            throw error;
        }
    }

    /**
     * Test helper method to reset cache state
     * @internal This method is only intended for testing purposes
     */
    static _resetCacheForTesting(): void {
        this._cache.clear();
        this._isLoaded = false;
    }
}
