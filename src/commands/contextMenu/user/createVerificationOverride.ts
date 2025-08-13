import { UserContextMenuCommandInteraction, PermissionsBitField, EmbedBuilder } from 'discord.js';
import Client from '#src/Client';
import { UserContextMenuCommand } from './UserContextMenuCommand';
import { GuildConfigCache } from '#util/guildConfigCache';
import { AdminConfigCache } from '#util/adminConfigCache';
import { handleCreateOverride } from '#commands/chat/verification/verifyOverrideFlows/verifyOverrideCreate';

export class CreateVerificationOverride extends UserContextMenuCommand {
    constructor(client: Client) {
        super(client, {
            name: 'Create Verification Override',
            category: 'Verification',
            guildOnly: true,
            clientPermissions: [PermissionsBitField.Flags.ManageRoles],
            userPermissions: [PermissionsBitField.Flags.ManageGuild, PermissionsBitField.Flags.ManageRoles],
        });
    }

    async execute(interaction: UserContextMenuCommandInteraction): Promise<void> {
        if (!interaction.inCachedGuild()) return;
        await interaction.deferReply({ ephemeral: true });

        // Check if verification is enabled in this server
        const config = await GuildConfigCache.fetchConfig(interaction.guild.id);
        if (!config.enableVerification) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription(
                            'Verification is not enabled in this server.\n\nLooking to enable verification? [Read the guide.](https://sir-goose.notion.site/sir-goose/Setting-Up-Verification-0f309b2a00fc4e198b5f2182d2452fcd)'
                        ),
                ],
            });
            return;
        }

        // Check preview mode restrictions
        const inPreview = (await AdminConfigCache.getConfig(AdminConfigCache.FLAGS.VERIFY_OVERRIDE_PREVIEW, 'false')) === 'true';
        if (inPreview) {
            const allowedGuildsRaw = await AdminConfigCache.getConfig(AdminConfigCache.FLAGS.VERIFY_OVERRIDE_GUILDS, '');
            const allowedGuildIds = allowedGuildsRaw
                .split(',')
                .map((id) => id.trim())
                .filter((id) => id.length > 0);

            if (!allowedGuildIds.includes(interaction.guildId)) {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Yellow')
                            .setDescription(
                                'This feature is in private preview. Want early access? Ask in the [support server](https://discord.gg/KHByMmrrw2).'
                            ),
                    ],
                });
                return;
            }
        }

        // extract target user from interaction
        const targetUser = interaction.targetUser;

        // call existing handleCreateOverride function with target user pre-populated
        await handleCreateOverride(interaction, interaction.user, [targetUser]);
    }
}
