import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import { GuildConfigCache } from '#util/guildConfigCache';
import { safeSendVerificationEmbed, sendVerificationReplies } from '#util/verification';
import UserModel from '#models/user.model';

export class ReVerify extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'reverify',
            description: 'Reverify your UW identity to update your roles',
            category: 'Verification',
            cooldownSeconds: 600,
            cooldownMaxUses: 5,
            isTextCommand: false,
        });
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: true });

        const config = await GuildConfigCache.fetchConfig(interaction.guild?.id);
        if (interaction.guild && config.enableVerification === false) {
            const embed = new EmbedBuilder().setDescription('This server does not have verification enabled.').setColor('Yellow');
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const user = await UserModel.findOne({ discordId: interaction.user.id });

        if (!user || !user.verified) {
            await sendVerificationReplies(this.client, interaction, interaction.user);
        } else {
            await safeSendVerificationEmbed(interaction, interaction.user, { isReverify: true });
        }
    }
}
