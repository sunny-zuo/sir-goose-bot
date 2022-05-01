import { CommandInteraction, Message } from 'discord.js';
import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import { GuildConfigCache } from '#util/guildConfigCache';
import { safeSendVerificationEmbed, sendVerificationReplies } from '#util/verification';
import UserModel from '#models/user.model';

export class ReVerify extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'reverify',
            description: 'Reverify your UW identity to update you roles',
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
        const user = await UserModel.findOne({ discordId: discordUser.id });

        if (!user || !user.verified) {
            await sendVerificationReplies(this.client, interaction, discordUser);
        } else {
            await safeSendVerificationEmbed(this.client, interaction, discordUser, true);
        }
    }
}
