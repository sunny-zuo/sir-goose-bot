import { ButtonInteraction, MessageEmbed } from 'discord.js';
import { ButtonInteractionHandler } from './buttonInteractionHandler';
import { sendVerificationReplies } from '../../helpers/verification';
import { Cooldown } from '../../helpers/cooldown';
import Client from '../../Client';

export class RequestVerificationLinkButtonInteractionHandler implements ButtonInteractionHandler {
    readonly client: Client;
    readonly customId = 'requestVerificationLink';
    readonly cooldown: Cooldown;

    constructor(client: Client) {
        this.client = client;
        this.cooldown = new Cooldown(60);
    }

    async execute(interaction: ButtonInteraction): Promise<void> {
        const userLimit = this.cooldown.checkLimit(interaction.user.id);

        if (userLimit.blocked) {
            interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle('Rate Limited')
                        .setColor('RED')
                        .setDescription(
                            `You can only request a verification link once every 60 seconds. Please try again in ${userLimit.secondsUntilReset} seconds. You likely don't need to request another verification link - older ones remain valid. Please message an admin if you have any issues with verification.`
                        ),
                ],
                ephemeral: true,
            });
        } else {
            sendVerificationReplies(this.client, interaction, interaction.user, true);
        }
    }
}
