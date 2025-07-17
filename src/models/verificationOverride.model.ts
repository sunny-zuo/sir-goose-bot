import { Snowflake } from 'discord.js';
import { Schema, model } from 'mongoose';

export enum OverrideScope {
    GUILD = 'GUILD',
}

export interface VerificationOverride {
    guildId: Snowflake;
    discordId: Snowflake;
    createdBy: Snowflake;
    department?: string;
    o365CreatedDate?: Date;
    scope: OverrideScope;
    createdAt: Date;
    updatedAt: Date;
}

const schema = new Schema<VerificationOverride>(
    {
        guildId: { type: String, required: true },
        discordId: { type: String, required: true },
        createdBy: { type: String, required: true },
        scope: { type: String, required: true },
        department: String,
        o365CreatedDate: Date,
    },
    {
        timestamps: true,
    }
);

const VerificationOverrideModel = model<VerificationOverride>('VerificationOverride', schema);

export default VerificationOverrideModel;
