import { Snowflake } from 'discord.js';
import { Schema, model } from 'mongoose';

export interface VerifyOverride {
    guildId: Snowflake;
    userId: Snowflake;
    createdBy: Snowflake;
    valid: boolean;
    global: boolean;
    reason: string;
    department?: string;
    year?: number;
}

const schema = new Schema<VerifyOverride>(
    {
        guildId: { type: String, required: true },
        userId: { type: String, required: true },
        createdBy: { type: String, required: true },
        valid: { type: Boolean, required: true },
        global: { type: Boolean, required: true },
        reason: { type: String, required: true },
        department: { type: String, required: false },
        year: { type: Number, default: false },
    },
    {
        timestamps: true,
    }
);

const VerifyOverrideModel = model<VerifyOverride>('VerifyOverride', schema);

export default VerifyOverrideModel;
