import {
    ApplicationCommandOption,
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
    EmbedBuilder,
    inlineCode,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageComponentInteraction,
} from 'discord.js';
import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import VerificationOverrideModel, { OverrideScope } from '#models/verificationOverride.model';
import UserModel from '#models/user.model';
import { logger } from '#util/logger';
import { VerificationDepartmentList } from '#types/Verification';
import { RoleAssignmentService } from '#services/roleAssignmentService';

export class GlobalOverride extends ChatCommand {
    private static options: ApplicationCommandOption[] = [
        {
            name: 'create',
            description: 'Create a global verification override for a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user',
                    description: 'The user ID to create an override for',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: 'department',
                    description: 'The department to set',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: 'entranceyear',
                    description: 'The entrance year to set',
                    type: ApplicationCommandOptionType.Number,
                    minValue: 2000,
                    maxValue: new Date().getFullYear() + 3,
                    required: false,
                },
            ],
        },
        {
            name: 'view',
            description: 'View a global verification override for a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user',
                    description: 'The user ID to view override for',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
        {
            name: 'delete',
            description: 'Delete a global verification override for a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user',
                    description: 'The user ID to delete override for',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
    ];

    constructor(client: Client) {
        super(client, {
            name: 'globaloverride',
            description: 'Manage global user verification overrides',
            category: 'Owner',
            options: GlobalOverride.options,
            isSlashCommand: true,
            isTextCommand: false,
            ownerOnly: true,
            displayHelp: false,
        });
    }

    async execute(
        interaction: ChatInputCommandInteraction,
        args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        await interaction.deferReply();

        const subcommand = args.getSubcommand();
        try {
            switch (subcommand) {
                case 'create':
                    await this.handleCreate(interaction, args);
                    break;
                case 'view':
                    await this.handleView(interaction, args);
                    break;
                case 'delete':
                    await this.handleDelete(interaction, args);
                    break;
                default:
                    await interaction.editReply({ content: 'Unknown subcommand.' });
                    logger.warn(`Unknown subcommand ${subcommand} for globaloverride command`);
            }
        } catch (error) {
            logger.error(error, `Error executing globaloverride ${subcommand} command`);
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';

            await interaction.followUp({
                embeds: [new EmbedBuilder().setColor('Red').setDescription(`Unexpected Error: ${errorMessage}`)],
                ephemeral: true,
            });
        }
    }

    private async handleCreate(
        interaction: ChatInputCommandInteraction,
        args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const userId = args.getString('user', true);
        const department = args.getString('department') ?? undefined;
        const entranceYear = args.getNumber('entranceyear');

        if (!department && !entranceYear) {
            await interaction.editReply({
                embeds: [new EmbedBuilder().setColor('Red').setDescription('You must provide at least a department or entrance year.')],
            });
            return;
        }

        // Check for existing global override
        const existing = await VerificationOverrideModel.findOne({
            discordId: userId,
            scope: OverrideScope.GLOBAL,
            deleted: { $exists: false },
        });

        if (existing) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription(
                            `A global override already exists for user ${inlineCode(userId)}.\n` +
                                `Department: ${inlineCode(existing.department ?? '<not set>')}\n` +
                                `Year: ${inlineCode(existing.o365CreatedDate?.getFullYear().toString() ?? '<not set>')}\n\n` +
                                `Delete the existing override first if you want to create a new one.`
                        ),
                ],
            });
            return;
        }

        // Query the user's actual verification data
        const user = await UserModel.findOne({ discordId: userId }).lean();

        const embed = new EmbedBuilder()
            .setTitle('Confirm Global Override Creation')
            .setColor('Orange')
            .setDescription(`You are creating a global verification override for <@${userId}>.`)
            .addFields(
                {
                    name: 'Current Data',
                    value:
                        `Department: ${inlineCode(user?.department ?? '<not verified>')}\n` +
                        `Entrance Year: ${inlineCode(user?.o365CreatedDate?.getFullYear().toString() ?? '<not verified>')}`,
                    inline: true,
                },
                {
                    name: 'Override Data',
                    value:
                        `Department: ${inlineCode(department ?? '<not overriding>')}\n` +
                        `Entrance Year: ${inlineCode(entranceYear?.toString() ?? '<not overriding>')}`,
                    inline: true,
                }
            );

        // Add warning if department doesn't match known departments
        if (department && !this.isValidDepartment(department)) {
            embed.addFields({
                name: '⚠️ Warning',
                value: `Department ${inlineCode(department)} does not match any known departments.`,
                inline: false,
            });
        }

        const confirmButton = new ButtonBuilder().setCustomId('globaloverrideConfirm').setLabel('Create').setStyle(ButtonStyle.Success);
        const cancelButton = new ButtonBuilder().setCustomId('globaloverrideCancel').setLabel('Cancel').setStyle(ButtonStyle.Danger);
        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmButton, cancelButton);

        const message = await interaction.editReply({ embeds: [embed], components: [buttons] });

        try {
            const confirmInteraction = await message.awaitMessageComponent({
                time: 1000 * 60 * 5,
                filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
            });

            if (confirmInteraction.customId === 'globaloverrideCancel') {
                await confirmInteraction.update({
                    embeds: [new EmbedBuilder().setColor('Grey').setDescription('Global override creation cancelled.')],
                    components: [],
                });
                return;
            }

            await confirmInteraction.deferUpdate();

            const override = new VerificationOverrideModel({
                discordId: userId,
                guildId: 'GLOBAL',
                createdBy: interaction.user.id,
                department: department,
                o365CreatedDate: entranceYear !== null ? new Date(entranceYear, 5) : undefined,
                scope: OverrideScope.GLOBAL,
            });

            await override.save();

            logger.info({
                globalOverride: {
                    message: `Global override created for ${userId}`,
                    userId,
                    department,
                    entranceYear,
                },
                user: interaction.user.id,
            });

            const successEmbed = new EmbedBuilder()
                .setTitle('Global Override Created')
                .setColor('Green')
                .setTimestamp()
                .addFields(
                    { name: 'User ID', value: inlineCode(userId), inline: true },
                    { name: 'Department', value: inlineCode(department ?? '<not set>'), inline: true },
                    { name: 'Entrance Year', value: inlineCode(entranceYear?.toString() ?? '<not set>'), inline: true }
                );

            const reassignButton = new ButtonBuilder()
                .setCustomId('globaloverrideReassign')
                .setLabel('Reassign Roles')
                .setStyle(ButtonStyle.Primary);
            const reassignButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(reassignButton);

            const reassignMessage = await confirmInteraction.editReply({ embeds: [successEmbed], components: [reassignButtons] });

            try {
                const reassignInteraction = await reassignMessage.awaitMessageComponent({
                    time: 1000 * 60 * 5,
                    filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
                });

                if (reassignInteraction.customId === 'globaloverrideReassign') {
                    await reassignInteraction.deferUpdate();

                    const roleAssignmentService = new RoleAssignmentService(userId);
                    const result = await roleAssignmentService.assignAllRoles(this.client);
                    const totalGuilds = result.changedGuildIds.length + result.unchangedGuildIds.length;

                    const successEmbed = new EmbedBuilder()
                        .setTitle('Global Override Created')
                        .setColor('Green')
                        .setTimestamp()
                        .addFields(
                            { name: 'User ID', value: inlineCode(userId), inline: true },
                            { name: 'Department', value: inlineCode(department ?? '<not set>'), inline: true },
                            { name: 'Entrance Year', value: inlineCode(entranceYear?.toString() ?? '<not set>'), inline: true },
                            { name: 'Roles Updated', value: `Roles have been updated in ${result.changedGuildIds.length}/${totalGuilds} guilds.` , inline: false }
                        );

                    await reassignInteraction.editReply({ embeds: [successEmbed], components: [] });
                }
            } catch (e) {
                if ((e as Error).name === 'Error [InteractionCollectorError]') {
                    await reassignMessage.edit({ components: [] });
                } else {
                    throw e;
                }
            }
        } catch (e) {
            if ((e as Error).name === 'Error [InteractionCollectorError]') {
                await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor('Grey').setDescription('Global override creation timed out.')],
                    components: [],
                });
            } else {
                throw e;
            }
        }
    }

    private async handleView(
        interaction: ChatInputCommandInteraction,
        args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const userId = args.getString('user', true);

        const override = await VerificationOverrideModel.findOne({
            discordId: userId,
            scope: OverrideScope.GLOBAL,
            deleted: { $exists: false },
        });

        if (!override) {
            await interaction.editReply({
                embeds: [new EmbedBuilder().setColor('Yellow').setDescription(`No global override found for user ${inlineCode(userId)}.`)],
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('Global Override')
            .setColor('Blue')
            .setTimestamp()
            .addFields(
                { name: 'User ID', value: inlineCode(userId), inline: true },
                { name: 'Department', value: inlineCode(override.department ?? '<not set>'), inline: true },
                { name: 'Entrance Year', value: inlineCode(override.o365CreatedDate?.getFullYear().toString() ?? '<not set>'), inline: true },
                { name: 'Created By', value: `<@${override.createdBy}>`, inline: true },
                { name: 'Created At', value: `<t:${Math.floor(override.createdAt.getTime() / 1000)}:R>`, inline: true }
            );

        await interaction.editReply({ embeds: [embed] });
    }

    private isValidDepartment(departmentName: string): boolean {
        return VerificationDepartmentList.some((dept) => dept.name === departmentName);
    }

    private async handleDelete(
        interaction: ChatInputCommandInteraction,
        args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const userId = args.getString('user', true);

        const override = await VerificationOverrideModel.findOne({
            discordId: userId,
            scope: OverrideScope.GLOBAL,
            deleted: { $exists: false },
        });

        if (!override) {
            await interaction.editReply({
                embeds: [new EmbedBuilder().setColor('Red').setDescription(`No global override found for user ${inlineCode(userId)}.`)],
            });
            return;
        }

        override.deleted = new Date();
        override.deletedBy = interaction.user.id;
        await override.save();

        logger.info({
            globalOverride: {
                message: `Global override deleted for ${userId}`,
                userId,
                department: override.department,
                entranceYear: override.o365CreatedDate?.getFullYear(),
            },
            user: interaction.user.id,
        });

        const embed = new EmbedBuilder()
            .setTitle('Global Override Deleted')
            .setColor('DarkRed')
            .setTimestamp()
            .addFields(
                { name: 'User ID', value: inlineCode(userId), inline: true },
                { name: 'Previous Department', value: inlineCode(override.department ?? '<not set>'), inline: true },
                { name: 'Previous Year', value: inlineCode(override.o365CreatedDate?.getFullYear().toString() ?? '<not set>'), inline: true }
            );

        await interaction.editReply({ embeds: [embed] });
    }
}
