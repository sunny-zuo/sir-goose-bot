import {
    ChatInputCommandInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    ButtonStyle,
    inlineCode,
    User,
    ButtonInteraction,
    Guild,
} from 'discord.js';
import { GuildConfigCache } from '#util/guildConfigCache';
import { RoleAssignmentService } from '#services/roleAssignmentService';
import UserModel from '#models/user.model';
import VerificationOverrideModel, { VerificationOverride } from '#models/verificationOverride.model';
import { Modlog } from '#util/modlog';
import { logger } from '#util/logger';
import { Document } from 'mongoose';

export async function handleDeleteOverride(interaction: ChatInputCommandInteraction, targetUser: User, guild: Guild): Promise<void> {
    try {
        const override = await VerificationOverrideModel.findOne({
            discordId: targetUser.id,
            guildId: guild.id,
            deleted: { $exists: false },
        });

        // exit early if no override exists to delete
        if (!override) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('No Override Found')
                .setThumbnail(targetUser.displayAvatarURL())
                .setDescription(`${targetUser} does not have a verification override in this guild to delete.`)
                .addFields({
                    name: 'Want to create a new override?',
                    value: `Use ${inlineCode('/verifyoverride create')} to create a new override for this user.`,
                    inline: false,
                });

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        await renderDeleteConfirmationScreen(interaction, targetUser, guild, override);
    } catch (error) {
        logger.error(error, 'Error in handleDeleteOverride');

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('An error occurred while processing the delete request. Please try again later.'),
            ],
        });
    }
}

export async function renderDeleteConfirmationScreen(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
    targetUser: User,
    guild: Guild,
    override: VerificationOverride & Document
): Promise<void> {
    try {
        if (!interaction.deferred) await interaction.deferReply({ ephemeral: true });

        const roleChangePrediction = await predictRoleChangesAfterDeletion(guild, targetUser, override);

        const embed = new EmbedBuilder()
            .setColor('Orange')
            .setTitle('Confirm Override Deletion')
            .setThumbnail(targetUser.displayAvatarURL())
            .setDescription(
                `⚠️ **Warning:** You are about to delete the verification override for ${targetUser}. This action cannot be undone.`
            )
            .addFields(
                {
                    name: 'Current Override',
                    value: `**Department:** ${
                        override.department ? inlineCode(override.department) : 'Not overridden'
                    }\n**Entrance Year:** ${
                        override.o365CreatedDate ? inlineCode(override.o365CreatedDate.getFullYear().toString()) : 'Not overridden'
                    }`,
                    inline: false,
                },
                {
                    name: 'Role Changes After Deletion',
                    value: roleChangePrediction,
                    inline: false,
                }
            );

        const confirmButton = new ButtonBuilder()
            .setCustomId(`verifyoverrideDeleteConfirm_${targetUser.id}`)
            .setLabel('Confirm Delete')
            .setStyle(ButtonStyle.Danger);

        const cancelButton = new ButtonBuilder()
            .setCustomId(`verifyoverrideDeleteCancel_${targetUser.id}`)
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary);

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

        const message = await interaction.editReply({ embeds: [embed], components: [buttons] });

        await message
            .awaitMessageComponent({ time: 1000 * 60 * 10, filter: (i) => i.user.id === interaction.user.id })
            .then(async (i) => {
                if (!i.isButton()) return;

                await i.deferUpdate();

                if (i.customId === `verifyoverrideDeleteConfirm_${targetUser.id}`) {
                    await performOverrideDeletion(i, targetUser, guild, override);
                } else if (i.customId === `verifyoverrideDeleteCancel_${targetUser.id}`) {
                    const cancelEmbed = new EmbedBuilder()
                        .setColor('Grey')
                        .setDescription('Override deletion was cancelled. No changes were made.');

                    await i.editReply({ embeds: [cancelEmbed], components: [] });
                }
            })
            .catch(async (e) => {
                if (e.name === 'Error [InteractionCollectorError]') {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor('Grey')
                        .setDescription('Override deletion timed out. No changes were made.');

                    await message.edit({ embeds: [timeoutEmbed], components: [] });
                } else {
                    throw e;
                }
            });
    } catch (error) {
        logger.error(error, 'Error in renderDeleteConfirmationScreen');

        await interaction.editReply({
            embeds: [new EmbedBuilder().setColor('Red').setDescription('An unexpected error occured. Please try again later.')],
            components: [],
        });
    }
}

async function predictRoleChangesAfterDeletion(guild: Guild, targetUser: User, override: VerificationOverride): Promise<string> {
    try {
        const guildConfig = await GuildConfigCache.fetchConfig(guild.id);
        
        if (!guildConfig || !guildConfig.verificationRules) {
            return 'No roles will change as verification is not configured and enabled for this server.';
        }

        const baseUser = await UserModel.findOne({ discordId: targetUser.id });
        const syntheticUserWithOverride = {
            verified: true,
            uwid: baseUser?.uwid || 'delete-prediction',
            department: override.department || baseUser?.department,
            o365CreatedDate: override.o365CreatedDate || baseUser?.o365CreatedDate,
        };

        const currentRoles = RoleAssignmentService.getMatchingRoleData(syntheticUserWithOverride, guildConfig, true);
        const normalRoles = RoleAssignmentService.getMatchingRoleData(baseUser, guildConfig, false);

        const currentRoleIds = new Set(currentRoles.map((role) => role.id));
        const normalRoleIds = new Set(normalRoles.map((role) => role.id));

        const rolesToRemove = currentRoles.filter((role) => !normalRoleIds.has(role.id));
        const rolesToAdd = normalRoles.filter((role) => !currentRoleIds.has(role.id));

        if (rolesToRemove.length === 0 && rolesToAdd.length === 0) {
            return 'No role changes will occur.';
        }

        let changeDescription = '';
        if (rolesToRemove.length > 0) {
            changeDescription += `**Roles to be removed:** ${rolesToRemove.map((role) => `<@&${role.id}>`).join(', ')}\n`;
        }
        if (rolesToAdd.length > 0) {
            changeDescription += `**Roles to be added:** ${rolesToAdd.map((role) => `<@&${role.id}>`).join(', ')}\n`;
        }

        // Special case: if user has no normal verification data
        if (!baseUser || !baseUser.verified || !baseUser.department || !baseUser.o365CreatedDate) {
            if (currentRoles.length > 0) {
                changeDescription +=
                    '\n⚠️ **Warning:** User is unverified. Thus, all verification roles will be removed after the override is deleted.';
            }
        }

        return changeDescription.trim();
    } catch (error) {
        logger.error(error, 'Error predicting role changes after deletion');
        return 'Unable to predict role changes due to an error.';
    }
}

async function performOverrideDeletion(
    interaction: ButtonInteraction,
    targetUser: User,
    guild: Guild,
    override: VerificationOverride & Document
): Promise<void> {
    try {
        // perform soft deletion by setting deleted timestamp and deletedBy
        await override.updateOne({
            deleted: new Date(),
            deletedBy: interaction.user.id,
        });

        // update user roles based on normal verification
        const member = await guild.members.fetch(targetUser.id).catch(() => null);
        let roleUpdateResult = null;

        if (member) {
            const roleService = new RoleAssignmentService(targetUser.id);
            roleUpdateResult = await roleService.assignGuildRoles(guild, {
                log: false,
                oldDepartment: override.department,
                oldYear: override.o365CreatedDate?.getFullYear(),
                returnMissing: false // show all roles in this view, rather than just the newly assigned ones
            });
        }

        await Modlog.logUserAction(
            guild,
            interaction.user,
            `Verification override deleted for ${targetUser} by ${interaction.user}.\n\n` +
                `**Removed Override:**\n` +
                `Department: ${inlineCode(override.department ?? 'not set')}\n` +
                `Entrance Year: ${inlineCode(override.o365CreatedDate?.getFullYear().toString() ?? 'not set')}\n\n` +
                `${
                    member
                        ? 'User roles have been updated to reflect normal verification data.'
                        : 'User is not in guild - roles will be updated if they rejoin.'
                }`,
            'Orange'
        );

        const successEmbed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Override Deleted Successfully')
            .setThumbnail(targetUser.displayAvatarURL())
            .setDescription(`The verification override for ${targetUser} has been deleted.`)
            .addFields({
                name: 'Deleted Override',
                value: `**Department:** ${override.department ? inlineCode(override.department) : 'Not overridden'}\n**Entrance Year:** ${
                    override.o365CreatedDate ? inlineCode(override.o365CreatedDate.getFullYear().toString()) : 'Not overridden'
                }`,
                inline: false,
            });

        if (member && roleUpdateResult?.success) {
            const assignedRoles = roleUpdateResult.value.assignedRoles;
            successEmbed.addFields({
                name: 'Role Updates',
                value:
                    assignedRoles.length > 0
                        ? `Assigned roles from normal verification: ${assignedRoles.map((role) => `<@&${role.id}>`).join(', ')}`
                        : 'No roles assigned from normal verification.',
                inline: false,
            });
        } else if (!member) {
            successEmbed.addFields({
                name: 'Role Updates',
                value: 'User is not currently in the guild. Roles will be updated if they rejoin.',
                inline: false,
            });
        } else if (roleUpdateResult && !roleUpdateResult.success) {
            successEmbed.addFields({
                name: 'Role Updates',
                value: `⚠️ Override was deleted but role update failed due to an unexpected error.`,
                inline: false,
            });
        }

        await interaction.editReply({ embeds: [successEmbed], components: [] });
    } catch (error) {
        logger.error(error, 'Error in performOverrideDeletion');

        await interaction.editReply({
            embeds: [
                new EmbedBuilder().setColor('Red').setDescription('An error occurred while deleting the override. Please try again later.'),
            ],
            components: [],
        });
    }
}
