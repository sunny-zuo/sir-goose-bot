import { ButtonInteraction } from 'discord.js';
import { ButtonInteractionHandler } from './buttonInteractionHandler';
import { sendVerificationReplies } from '#util/verification';
import { Cooldown } from '#util/cooldown';
import Client from '#src/Client';

export class RequestVerificationLink implements ButtonInteractionHandler {
    readonly client: Client;
    readonly customId = 'requestVerificationLink';
    readonly cooldown: Cooldown;
    readonly limitMessage = `You've been rate-limited from requesting verification links for 10 minutes. You likely don't need to request another verification link - older ones remain valid. Please message an admin if you have any issues with verification.`;

    constructor(client: Client) {
        this.client = client;
        this.cooldown = new Cooldown(600, 5);
    }

    async execute(interaction: ButtonInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: true });
        await sendVerificationReplies(this.client, interaction, interaction.user);
    }
}
