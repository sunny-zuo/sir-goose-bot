import { Snowflake } from 'discord.js';
import { Schema, model, FilterQuery, UpdateQuery, UpdateWithAggregationPipeline, QueryOptions } from 'mongoose';
import { GuildConfigCache } from '../helpers/guildConfigCache';

enum RenameType {
    FULL_NAME = 'FULL_NAME',
    FIRST_NAME = 'FIRST_NAME',
}

export interface GuildConfig {
    guildId: Snowflake;
    prefix: string;
    enableVerification: boolean;
    verificationRules?: {
        baseYear: number;
        renameType?: RenameType;
        forceRename?: boolean;
        rules: [
            {
                roles: [
                    {
                        name: string;
                        id: Snowflake;
                    }
                ];
                department: string;
                matchType: string;
                yearMatch: string;
                year?: number;
            }
        ];
    };
    enablePins: boolean;
}

const guildConfigSchema = new Schema<GuildConfig>(
    {
        guildId: { type: String, required: true },
        prefix: { type: String, default: '$', trim: true },
        enablePins: { type: Boolean, default: false },
        enableVerification: { type: Boolean, default: false },
        verificationRules: {
            baseYear: { type: Number, required: true },
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
                    department: { type: String, required: true },
                    matchType: { type: String, required: true },
                    yearMatch: { type: String, required: true },
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
