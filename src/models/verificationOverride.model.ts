import { Snowflake } from 'discord.js';
import { Schema, model } from 'mongoose';

export enum OverrideScope {
    GUILD = 'GUILD',
    GLOBAL = 'GLOBAL',
}

export interface VerificationOverride {
    guildId: Snowflake;
    discordId: Snowflake;
    createdBy: Snowflake;
    department?: string;
    o365CreatedDate?: Date;
    scope: OverrideScope;
}

const schema = new Schema<VerificationOverride>(
    {
        guildId: { type: String, required: true },
        discordId: { type: String, required: true },
        createdBy: { type: String, required: true },
        department: String,
        o365CreatedDate: Date,
        scope: String,
    },
    {
        timestamps: true,
    }
);

const VerificationOverrideModel = model<VerificationOverride>('VerificationOverride', schema);

export default VerificationOverrideModel;
