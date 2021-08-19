import { Snowflake } from 'discord.js';
import { Schema, model } from 'mongoose';

type RoleData = {
    name: string;
    id: Snowflake;
};

export interface ButtonRole {
    guildId: Snowflake;
    channelId: Snowflake;
    messageId: Snowflake;
    roles: RoleData[];
}

const schema = new Schema<ButtonRole>(
    {
        guildId: { type: String, required: true },
        channelId: { type: String, required: true },
        messageId: { type: String, required: true },
        roles: [
            {
                name: { type: String, required: true },
                id: { type: String, required: true },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const ButtonRoleModel = model<ButtonRole>('ButtonRole', schema);

export default ButtonRoleModel;
