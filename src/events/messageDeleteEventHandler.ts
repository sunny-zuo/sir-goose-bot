import Client from '#src/Client';
import { EventHandler } from './eventHandler';
import { Message } from 'discord.js';
import ButtonRoleModel from '#models/buttonRole.model';

export class MessageDeleteEventHandler implements EventHandler {
    readonly eventName = 'messageDelete';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(message: Message): Promise<void> {
        this.cleanupButtonRoles(message);
    }

    async cleanupButtonRoles(message: Message): Promise<void> {
        if (!message.partial && (message.author !== this.client.user || message.components.length === 0)) return;

        const deleteResult = await ButtonRoleModel.deleteOne({ messageId: message.id });
        if (deleteResult.acknowledged && deleteResult.deletedCount) {
            this.client.log.info(`Deleted button role with message id ${message.id}.`);
        }
    }
}
