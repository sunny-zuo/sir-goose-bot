import {
    ChatInputCommandInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    ButtonStyle,
    inlineCode,
    User,
    Guild,
} from 'discord.js';
import { GuildConfigCache } from '#util/guildConfigCache';
import { RoleAssignmentService } from '#services/roleAssignmentService';
import UserModel from '#models/user.model';
import VerificationOverrideModel from '#models/verificationOverride.model';
import { logger } from '#util/logger';
import { renderDeleteConfirmationScreen } from './verifyOverrideDelete';
import { catchUnknownMessage } from '#util/message';

export async function handleViewOverride(interaction: ChatInputCommandInteraction, targetUser: User, guild: Guild): Promise<void> {
    try {
        const guildConfig = await GuildConfigCache.fetchConfig(guild.id);

        const override = await VerificationOverrideModel.findOne({
            discordId: targetUser.id,
            guildId: guild.id,
            deleted: { $exists: false },
        });

        if (!override) {
            // Calculate roles from normal verification (without override) to display

            let rolesFromVerificationInfo = '*None* (user is unverified)';

            if (guildConfig && guildConfig.verificationRules) {
                const baseUser = await UserModel.findOne({ discordId: targetUser.id });

                if (baseUser && baseUser.verified && baseUser.department && baseUser.o365CreatedDate) {
                    const roleData = RoleAssignmentService.getMatchingRoleData(
                        baseUser,
                        guildConfig,
                        false // don't skip custom imports for normal verification
                    );

                    if (roleData.length > 0) {
                        rolesFromVerificationInfo = roleData.map((role) => `<@&${role.id}>`).join(', ');
                    } else {
                        rolesFromVerificationInfo =
                            '*None* (user is verified, but is not assigned any roles due to the verification rule configuration)';
                    }
                }
            }

            const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setTitle(`No Verification Override Found`)
                .setThumbnail(targetUser.displayAvatarURL())
                .setDescription(`${targetUser} does not have a verification override in this guild.`)
                .addFields({
                    name: 'Roles Assigned from Verification',
                    value: rolesFromVerificationInfo,
                })
                .addFields({
                    name: 'Need to create an override?',
                    value: `Use ${inlineCode('/verifyoverride create')} to set a custom department or entrance year for this user.`,
                    inline: false,
                });

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        // calculate roles based on override
        let assignedRoles: string[] = [];

        if (guildConfig && guildConfig.verificationRules) {
            const baseUser = await UserModel.findOne({ discordId: targetUser.id });

            // create synthetic user object with override data applied
            const syntheticUser = {
                verified: true,
                uwid: baseUser?.uwid || 'override-view',
                department: override.department || baseUser?.department,
                o365CreatedDate: override.o365CreatedDate || baseUser?.o365CreatedDate,
            };

            // only calculate roles if we have the required data
            if (syntheticUser.department && syntheticUser.o365CreatedDate) {
                const roleData = RoleAssignmentService.getMatchingRoleData(
                    syntheticUser,
                    guildConfig,
                    true // skip custom imports so override takes precedence
                );

                // convert role data to role mentions
                assignedRoles = roleData.map((role) => `<@&${role.id}>`);
            }
        }

        // check if user is currently in the guild
        const member = await guild.members.fetch(targetUser.id).catch(() => null);
        const userInGuild = member !== null;

        // create detailed embed for override information
        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle(`Verification Override for ${targetUser.displayName}`)
            .setThumbnail(targetUser.displayAvatarURL());

        // add footer if user is not in guild
        if (!userInGuild) {
            embed.setFooter({ text: 'Note: This user is not currently in the guild, but the override will apply if they rejoin.' });
        }

        // Add override status and details
        embed.addFields(
            {
                name: 'Override Status',
                value: 'Active',
                inline: true,
            },
            {
                name: 'Department',
                value: override.department ? inlineCode(override.department) : 'Not overridden',
                inline: true,
            },
            {
                name: 'Entrance Year',
                value: override.o365CreatedDate ? inlineCode(override.o365CreatedDate.getFullYear().toString()) : 'Not overridden',
                inline: true,
            }
        );

        // Add creator and creation date
        embed.addFields(
            {
                name: 'Created By',
                value: `<@${override.createdBy}>`,
                inline: true,
            },
            {
                name: 'Created Date',
                value: `<t:${Math.floor(override.createdAt.getTime() / 1000)}:F>`,
                inline: true,
            },
            {
                name: 'Roles Assigned from Verification',
                value: assignedRoles.length > 0 ? assignedRoles.join(', ') : '*None assigned*',
                inline: false,
            }
        );

        const deleteButton = new ButtonBuilder()
            .setCustomId(`verifyoverrideViewDelete_${targetUser.id}`)
            .setLabel('Delete Override')
            .setStyle(ButtonStyle.Danger);
        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(deleteButton);

        const message = await interaction.editReply({ embeds: [embed], components: [buttonRow] });

        message
            .awaitMessageComponent({ time: 1000 * 60 * 10, filter: (i) => i.user.id === interaction.user.id })
            .then(async (i) => {
                if (!i.isButton()) return;

                if (i.customId === `verifyoverrideViewDelete_${targetUser.id}`) {
                    // start delete confirmation flow
                    await i.deferReply();
                    await interaction.editReply({ components: [] }).catch(catchUnknownMessage);
                    await renderDeleteConfirmationScreen(i, targetUser, guild, override);
                }
            })
            .catch(async (e) => {
                if (e.name === 'Error [InteractionCollectorError]') {
                    await interaction.editReply({ components: [] }).catch(catchUnknownMessage);
                } else {
                    throw e;
                }
            });
    } catch (error) {
        logger.error(error, 'Error in handleViewSubcommand');

        await interaction
            .editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('An error occurred while viewing the verification override. Please try again later.'),
                ],
            })
            .catch(catchUnknownMessage);
    }
}
