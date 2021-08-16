import { Snowflake } from 'discord.js';
import { Schema, model } from 'mongoose';

export interface ButtonRole {
    guildId: Snowflake;
    messageId: Snowflake;
    roleIds: Snowflake[];
}

const schema = new Schema<ButtonRole>({
    guildId: { type: String, required: true },
    messageId: { type: String, required: true },
    roleIds: { type: [String], required: true },
});

const ButtonRoleModel = model<ButtonRole>('ButtonRole', schema);

export default ButtonRoleModel;
