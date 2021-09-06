import { CommandInteraction, Message } from 'discord.js';
import Client from '../../../Client';
import { ChatCommand } from '../ChatCommand';
import { GuildConfigCache } from '../../../helpers/guildConfigCache';
import { sendVerificationReplies } from '../../../helpers/verification';

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
            return this.sendErrorEmbed(interaction, 'Verification Not Enabled', 'This server does not have verification enabled.');
        }

        const discordUser = this.getUser(interaction);

        await sendVerificationReplies(this.client, interaction, discordUser);
    }
}
