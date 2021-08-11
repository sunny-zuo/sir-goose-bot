import { Snowflake } from 'discord.js';
import { Schema, model } from 'mongoose';

export interface Ban {
    guildId: Snowflake;
    userId: Snowflake;
    uwid: string;
    expiry: Date;
    reason: string;
    bannedBy: Snowflake;
    unbanned: boolean;
}

const schema = new Schema<Ban>({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    uwid: { type: String, required: true },
    expiry: Date,
    reason: String,
    bannedBy: { type: String, required: true },
    unbanned: { type: Boolean, default: false },
});

const BanModel = model<Ban>('Ban', schema);

export default BanModel;
