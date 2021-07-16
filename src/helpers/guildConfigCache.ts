import { Collection, Snowflake } from 'discord.js';
import GuildConfigModel, { GuildConfig } from '../models/guildConfig.model';

const cache = new Collection<Snowflake, GuildConfig>();

function getDefaultConfig(guildId: Snowflake): GuildConfig {
    return {
        guildId: guildId,
        prefix: '$',
        enableVerification: false,
        enablePins: false,
    };
}

export class GuildConfigCache {
    static async fetchConfig(guildId: Snowflake | undefined, bypassCache = false): Promise<GuildConfig> {
        if (guildId === undefined) {
            // TODO: make this less hacky/more clear
            return getDefaultConfig(`${-1}`);
        }

        const cachedConfig: GuildConfig | undefined = cache.get(guildId);

        if (bypassCache || cachedConfig === undefined) {
            const guildConfig: GuildConfig | null = await GuildConfigModel.findOne({ guildId: guildId });

            if (guildConfig === null) {
                return getDefaultConfig(guildId);
            }

            cache.set(guildId, guildConfig);
            return guildConfig;
        } else {
            return cachedConfig;
        }
    }

    static updateCache(guildConfig: GuildConfig): void {
        const guildId = guildConfig.guildId;
        cache.set(guildId, guildConfig);
    }
}
