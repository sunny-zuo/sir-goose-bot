import { Collection, Snowflake } from 'discord.js';
import GuildConfigModel, { GuildConfig } from '../models/guildConfig.model';

export class GuildConfigCache {
    private static _cache = new Collection<Snowflake, GuildConfig>();

    static async fetchConfig(guildId: Snowflake | undefined, bypassCache = false): Promise<GuildConfig> {
        const cache = this._cache;

        if (guildId === undefined) {
            // TODO: make this less hacky/more clear
            return this.getDefaultConfig(`${-1}`);
        }

        const cachedConfig: GuildConfig | undefined = cache.get(guildId);

        if (bypassCache || cachedConfig === undefined) {
            const guildConfig: GuildConfig | null = await GuildConfigModel.findOne({ guildId: guildId });

            if (guildConfig === null) {
                return this.getDefaultConfig(guildId);
            }

            cache.set(guildId, guildConfig);
            return guildConfig;
        } else {
            console.log('hit cache');
            return cachedConfig;
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
            enableVerification: false,
            enablePins: false,
        };
    }
}
