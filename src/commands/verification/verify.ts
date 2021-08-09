import { CommandInteraction, Message } from 'discord.js';
import Client from '../../Client';
import { Command } from '../Command';
import { GuildConfigCache } from '../../helpers/guildConfigCache';
import { sendVerificationReplies } from '../../helpers/verification';

export class Verify extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'verify',
            description: 'Verify your UW identity to receive roles',
            category: 'Verification',
            cooldownSeconds: 60,
        });
    }

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        const config = await GuildConfigCache.fetchConfig(interaction.guild?.id);
        if (interaction.guild && config.enableVerification === false) {
            return this.sendErrorEmbed(interaction, 'Verification Not Enabled', 'This server does not have verification enabled.');
        }

        const discordUser = this.isMessage(interaction) ? interaction.author : interaction.user;
        if (!discordUser) return;

        sendVerificationReplies(this.client, interaction, discordUser);
    }
}
