import Client from '../Client';
import { EventHandler } from './eventHandler';
import { Message } from 'discord.js';
import ButtonRoleModel from '../models/buttonRole.model';

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
        if (message.author !== this.client.user || message.components.length === 0) return;

        const buttonRoleDoc = await ButtonRoleModel.findOne({ messageId: message.id });
        if (buttonRoleDoc) {
            await buttonRoleDoc.delete();
        }
    }
}
