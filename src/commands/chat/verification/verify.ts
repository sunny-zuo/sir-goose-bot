import { CommandInteraction, Message } from 'discord.js';
import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import { GuildConfigCache } from '#util/guildConfigCache';
import { sendVerificationReplies } from '#util/verification';

export class Verify extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'verify',
            description: 'Verify your UW identity to receive roles',
            category: 'Verification',
            cooldownSeconds: 600,
            cooldownMaxUses: 5,
        });
    }

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        const config = await GuildConfigCache.fetchConfig(interaction.guild?.id);
        if (interaction.guild && config.enableVerification === false) {
            await this.sendErrorEmbed(interaction, 'Verification Not Enabled', 'This server does not have verification enabled.');
            return;
        }

        const discordUser = this.getUser(interaction);

        await sendVerificationReplies(this.client, interaction, discordUser);
    }
}
