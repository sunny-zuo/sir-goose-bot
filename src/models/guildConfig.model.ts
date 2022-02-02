import { Snowflake } from 'discord.js';
import { Schema, model } from 'mongoose';
import { GuildConfigCache } from '#util/guildConfigCache';
import { VerificationRules } from '#types/Verification';

export interface GuildConfig {
    guildId: Snowflake;
    prefix: string;
    enableModlog: boolean;
    modlogChannelId?: Snowflake;
    enablePins: boolean;
    enableVerification: boolean;
    verificationRules?: VerificationRules;
}

const guildConfigSchema = new Schema<GuildConfig>(
    {
        guildId: { type: String, required: true },
        prefix: { type: String, default: '$', trim: true },
        enableModlog: { type: Boolean, default: false },
        modlogChannelId: { type: String, trim: true },
        enablePins: { type: Boolean, default: false },
        enableVerification: { type: Boolean, default: false },
        verificationRules: {
            baseYear: Number,
            renameType: String,
            forceRename: Boolean,
            rules: [
                {
                    roles: [
                        {
                            name: String,
                            id: String,
                        },
                    ],
                    department: String,
                    matchType: String,
                    yearMatch: String,
                    year: Number,
                },
            ],
        },
    },
    {
        timestamps: true,
    }
);

guildConfigSchema.post('save', function (guildConfig) {
    GuildConfigCache.updateCache(guildConfig);
});

const GuildConfigModel = model<GuildConfig>('GuildConfig', guildConfigSchema);

export default GuildConfigModel;
