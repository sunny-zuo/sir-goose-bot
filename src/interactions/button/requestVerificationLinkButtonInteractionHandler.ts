import { ButtonInteraction } from 'discord.js';
import { ButtonInteractionHandler } from './buttonInteractionHandler';
import { sendVerificationReplies } from '../../helpers/verification';
import Client from '../../Client';

export class RequestVerificationLinkButtonInteractionHandler implements ButtonInteractionHandler {
    readonly client: Client;
    readonly customId = 'requestVerificationLink';

    constructor(client: Client) {
        this.client = client;
    }

    async execute(interaction: ButtonInteraction): Promise<void> {
        sendVerificationReplies(this.client, interaction, interaction.user, true);
    }
}
