import Client from '../Client';
import { EventHandler } from './eventHandler';
import { Collection, Message, Snowflake } from 'discord.js';
import ButtonRoleModel from '../models/buttonRole.model';

export class MessageDeleteBulkEventHandler implements EventHandler {
    readonly eventName = 'messageDeleteBulk';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(messages: Collection<Snowflake, Message>): Promise<void> {
        this.cleanupButtonRoles(messages);
    }

    async cleanupButtonRoles(messages: Collection<Snowflake, Message>): Promise<void> {
        for (const message of messages.values()) {
            if (message.author !== this.client.user || message.components.length === 0) return;

            const buttonRoleDoc = await ButtonRoleModel.findOne({ messageId: message.id });
            if (buttonRoleDoc) {
                await buttonRoleDoc.delete();
            }
        }
    }
}
