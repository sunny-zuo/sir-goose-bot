import Client from '#src/Client';
import { EventHandler } from './eventHandler';
import { Message } from 'discord.js';
import ButtonRoleModel from '#models/buttonRole.model';
import { logger } from '#util/logger';

export class MessageDeleteEventHandler implements EventHandler {
    readonly eventName = 'messageDelete';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(message: Message): Promise<void> {
        await this.cleanupButtonRoles(message);
    }

    async cleanupButtonRoles(message: Message): Promise<void> {
        if (!message.partial && (message.author !== this.client.user || message.components.length === 0)) return;

        const deleteResult = await ButtonRoleModel.deleteOne({ messageId: message.id });
        if (deleteResult.acknowledged && deleteResult.deletedCount) {
            logger.info({ event: { name: this.eventName }, messageId: message.id }, `Deleted button role with message id ${message.id}.`);
        }
    }
}
