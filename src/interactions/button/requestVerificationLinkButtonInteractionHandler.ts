import { ButtonInteraction } from 'discord.js';
import { ButtonInteractionHandler } from './buttonInteractionHandler';
import { sendVerificationReplies } from '../../helpers/verification';

export class RequestVerificationLinkButtonInteractionHandler implements ButtonInteractionHandler {
    readonly customId = 'requestVerificationLink';

    async execute(interaction: ButtonInteraction): Promise<void> {
        sendVerificationReplies(interaction, interaction.user, true);
    }
}
