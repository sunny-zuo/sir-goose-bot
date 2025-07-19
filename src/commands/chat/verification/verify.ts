import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, PermissionsBitField } from 'discord.js';
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
            isTextCommand: false,
            cooldownSeconds: 600,
            cooldownMaxUses: 5,
        });
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();

        const config = await GuildConfigCache.fetchConfig(interaction.guild?.id);

        if (interaction.guild && config.enableVerification === false) {
            const member = interaction.member as GuildMember | null;

            let infoString = 'This server does not have verification enabled.';
            if (member && member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                infoString +=
                    '\nLooking to enable verification? [Read the guide.](https://sir-goose.notion.site/sir-goose/Setting-Up-Verification-0f309b2a00fc4e198b5f2182d2452fcd)';
            }

            const embed = new EmbedBuilder().setDescription(infoString).setColor('Yellow');
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        await sendVerificationReplies(this.client, interaction, interaction.user);
    }
}
