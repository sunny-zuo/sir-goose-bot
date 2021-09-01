import { ButtonInteraction } from 'discord.js';
import { ButtonInteractionHandler } from './buttonInteractionHandler';
import { sendVerificationReplies } from '../../helpers/verification';
import { Cooldown } from '../../helpers/cooldown';
import Client from '../../Client';

export class RequestVerificationLink implements ButtonInteractionHandler {
    readonly client: Client;
    readonly customId = 'requestVerificationLink';
    readonly cooldown: Cooldown;
    readonly limitMessage = `You can only request a verification link once every 60 seconds. You likely don't need to request another verification link - older ones remain valid. Please message an admin if you have any issues with verification.`;

    constructor(client: Client) {
        this.client = client;
        this.cooldown = new Cooldown(60);
    }

    async execute(interaction: ButtonInteraction): Promise<void> {
        await sendVerificationReplies(this.client, interaction, interaction.user, true);
    }
}
