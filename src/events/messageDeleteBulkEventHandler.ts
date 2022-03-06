import Client from '#src/Client';
import { EventHandler } from './eventHandler';
import { Collection, Message, Snowflake } from 'discord.js';
import ButtonRoleModel from '#models/buttonRole.model';
import { logger } from '#util/logger';

export class MessageDeleteBulkEventHandler implements EventHandler {
    readonly eventName = 'messageDeleteBulk';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(messages: Collection<Snowflake, Message>): Promise<void> {
        await this.cleanupButtonRoles(messages);
    }

    async cleanupButtonRoles(messages: Collection<Snowflake, Message>): Promise<void> {
        const messagesToCheck: Message[] = [];

        for (const message of messages.values()) {
            if (message.partial) {
                messagesToCheck.push(message);
            } else {
                if (message.author !== this.client.user || message.components.length === 0) continue;
                messagesToCheck.push(message);
            }
        }

        const messageIds = messagesToCheck.map((message) => message.id);

        const deleteResult = await ButtonRoleModel.deleteMany({ messageId: { $in: messageIds } });
        if (deleteResult.acknowledged && deleteResult.deletedCount) {
            logger.info(
                { event: { name: this.eventName }, messageIds: [...messages.keys()] },
                `Deleted ${deleteResult.deletedCount} button role documents from bulk message delete.`
            );
        }
    }
}
