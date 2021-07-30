import { Collection, Snowflake } from 'discord.js';
import { Document } from 'mongoose';
import GuildConfigModel, { GuildConfig } from '../models/guildConfig.model';

export class GuildConfigCache {
    private static _cache = new Collection<Snowflake, GuildConfig>();

    static async fetchConfig(guildId: Snowflake | undefined, bypassCache = false): Promise<GuildConfig> {
        const cache = this._cache;

        if (guildId === undefined) {
            // TODO: make this less hacky/more clear
            return this.getDefaultConfig(`${-1}`);
        }

        const cachedConfig = cache.get(guildId);

        if (bypassCache || cachedConfig === undefined) {
            const guildConfig = await GuildConfigModel.findOne({ guildId: guildId });

            if (guildConfig === null) {
                return this.getDefaultConfig(guildId);
            }

            cache.set(guildId, guildConfig);
            return guildConfig;
        } else {
            return cachedConfig;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static async fetchOrCreate(guildId: Snowflake): Promise<GuildConfig & Document<any, any, GuildConfig>> {
        const cache = this._cache;
        const guildConfig = await GuildConfigModel.findOne({ guildId: guildId });

        if (guildConfig) {
            cache.set(guildId, guildConfig);
            return guildConfig;
        } else {
            const newConfig = await GuildConfigModel.create(this.getDefaultConfig(guildId));
            cache.set(guildId, newConfig);
            return newConfig;
        }
    }

    static updateCache(guildConfig: GuildConfig): void {
        const guildId = guildConfig.guildId;
        this._cache.set(guildId, guildConfig);
    }

    private static getDefaultConfig(guildId: Snowflake): GuildConfig {
        return {
            guildId: guildId,
            prefix: '$',
            enableModlog: false,
            enableVerification: false,
            enablePins: false,
        };
    }
}
