import {
    ChatInputCommandInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    PermissionsBitField,
    ApplicationCommandOption,
    ApplicationCommandOptionType,
    StringSelectMenuOptionBuilder,
    StringSelectMenuBuilder,
    CommandInteractionOptionResolver,
    ButtonStyle,
    inlineCode,
    User,
    ButtonInteraction,
    UserSelectMenuBuilder,
    Guild,
} from 'discord.js';
import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import { GuildConfigCache } from '#util/guildConfigCache';
import { VerificationDefaultStartingYears, VerificationDepartmentList } from '#types/Verification';
import { RoleAssignmentService } from '#services/roleAssignmentService';
import UserModel from '#models/user.model';
import VerificationOverrideModel from '#models/verificationOverride.model';

export class VerifyOverride extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'create',
            description: 'Create a verification override.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user',
                    description: 'User to override verification data for',
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
                {
                    name: 'department',
                    description: 'The verification department to set for the chosen user. Optional.',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: 'entranceyear',
                    description: 'The entrance year to set for the chosen user. Optional.',
                    type: ApplicationCommandOptionType.Number,
                    minValue: 2000,
                    maxValue: 2026,
                    required: false,
                },
            ],
        },
    ];

    constructor(client: Client) {
        super(client, {
            name: 'verifyoverride',
            description: 'Manually override the department and/or entrance year of a user for verification purposes.',
            category: 'Verification',
            options: VerifyOverride.options,
            guildOnly: true,
            clientPermissions: [PermissionsBitField.Flags.ManageRoles],
            userPermissions: [PermissionsBitField.Flags.ManageGuild, PermissionsBitField.Flags.ManageRoles],
        });
    }

    async execute(
        interaction: ChatInputCommandInteraction,
        args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        await interaction.deferReply({ ephemeral: true });

        const config = await GuildConfigCache.fetchConfig(interaction.guild!.id);
        if (!config.enableVerification) {
            await this.sendErrorEmbed(
                interaction,
                'Verification Not Enabled',
                `This server does not have verification enabled.

                Looking to enable verification? [Read the guide.](https://sir-goose.notion.site/sir-goose/Setting-Up-Verification-0f309b2a00fc4e198b5f2182d2452fcd)`
            );
            return;
        }

        let users = [args.getUser('user', true)];
        const customDept = args.getString('department');
        const customYear = args.getNumber('entranceyear')?.toString() ?? null;
        let selectedDept: string | null = customDept;
        let selectedYear: string | null = customYear;

        const embed = new EmbedBuilder().setColor('Blue').setTitle('Create Verification Override').setDescription(`
                Manually set the department and/or entrance year of user(s) for verification purposes. You can use this feature to fix data inaccuracies or to manually verify a user for this guild.

                This override will last until it is deleted, so commands like ${inlineCode(
                    '/verifyall'
                )} will use the overridden details and users will be verified with the overridden details if they rejoin the server.

                To verify an unverified user, both the department and year must be set. If a field is not overridden, then it will fallback to using the user's info for the missing field.

                If you want to create an override with a department or year not in the list, please provide it when you use ${inlineCode(
                    '/verifyoverride create'
                )}.
            `);

        const message = await interaction.editReply({
            embeds: [embed],
            components: renderSelectionComponents(users, customDept, selectedDept, customYear, selectedYear),
        });

        let finished = false;
        while (!finished) {
            await message
                .awaitMessageComponent({ time: 1000 * 60 * 5 })
                .then(async (i) => {
                    if (['verifyoverrideDepartmentSelect', 'verifyoverrideYearSelect'].includes(i.customId)) {
                        if (!i.isStringSelectMenu())
                            throw new Error("verifyoverride received dept select interaction that wasn't a string select");

                        if (i.customId === 'verifyoverrideDepartmentSelect') {
                            selectedDept = i.values[0];
                        } else if (i.customId === 'verifyoverrideYearSelect') {
                            selectedYear = i.values[0];
                        }

                        await i.update({
                            components: renderSelectionComponents(users, customDept, selectedDept, customYear, selectedYear),
                        });
                    } else if (i.customId === 'verifyoverrideUsersSelect') {
                        if (!i.isUserSelectMenu())
                            throw new Error("verifyoverride received user select interaction that wasn't a select menu");

                        users = [...i.users.values()];
                        await i.update({
                            components: renderSelectionComponents(users, customDept, selectedDept, customYear, selectedYear),
                        });
                    } else if (i.customId === 'verifyoverrideCancel') {
                        const embed = new EmbedBuilder()
                            .setColor('Grey')
                            .setDescription('This verification override creation was cancelled, so no changes were made.');

                        await i.update({ embeds: [embed], components: [] });
                        finished = true;
                    } else if (i.customId === 'verifyoverrideContinue') {
                        if (!i.isButton()) throw new Error("verifyoverride received continue button interaction that wasn't a button");
                        if (selectedDept === null && selectedYear === null) throw new Error('verifyoverride creation with nothing set');

                        await i.deferUpdate();

                        const existingOverrides = await VerificationOverrideModel.find({
                            discordId: { $in: users.map((user) => user.id) },
                            guildId: i.guild!.id,
                        });

                        if (existingOverrides.length > 0) {
                            const existingOverridesString = existingOverrides
                                .map(
                                    (override) =>
                                        `* <@${override.discordId}> (dept ${inlineCode(
                                            override.department ?? 'not set'
                                        )}, year ${inlineCode(override.o365CreatedDate?.getFullYear().toString() ?? 'not set')})`
                                )
                                .join('\n');

                            const embed = new EmbedBuilder().setColor('Red')
                                .setDescription(`The following selected users already have an override in this guild:
                                ${existingOverridesString}
                                
                                Please unselect the users with existing overrides and try again. If you want to modify an existing override, you must first delete it.`);

                            await i.followUp({ embeds: [embed], ephemeral: true });
                            return;
                        }

                        if (selectedDept && selectedYear) {
                            await renderOverrideConfirmationScreen(i, users, selectedDept, selectedYear);
                            finished = true;
                            return;
                        } else {
                            const allUserIds = users.map((user) => user.id);
                            const verifiedUsers = await UserModel.find({ verified: true, discordId: { $in: allUserIds } });

                            if (verifiedUsers.length === allUserIds.length) {
                                await renderOverrideConfirmationScreen(i, users, selectedDept, selectedYear);
                                finished = true;
                                return;
                            } else {
                                const unverifiedUsers = users.filter((user) => !verifiedUsers.some((vUser) => vUser.discordId === user.id));
                                const errorEmbed = new EmbedBuilder().setColor('Red')
                                    .setDescription(`The following selected users are not verified:

                                    ${unverifiedUsers.map((user) => `* <@${user.id}>`).join('\n')}

                                    To create an override for an unverified user, both the department and year must be set. Please select a department and year, or unselect the unverified users and try again.`);

                                await i.followUp({ embeds: [errorEmbed], ephemeral: true });
                            }
                        }
                    }
                })
                .catch(async (e) => {
                    if (e.name === 'Error [InteractionCollectorError]') {
                        const embed = new EmbedBuilder()
                            .setColor('Grey')
                            .setDescription('This verification override creation expired, so no changes were made.');

                        await message.edit({ embeds: [embed], components: [] });
                        finished = true;
                    } else {
                        throw e;
                    }
                });
        }
    }
}

function createUsersSelectMenu(users: User[]): ActionRowBuilder<UserSelectMenuBuilder> {
    return new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
        new UserSelectMenuBuilder()
            .setCustomId('verifyoverrideUsersSelect')
            .setPlaceholder('Select user(s) to create override for.')
            .setMinValues(1)
            .setMaxValues(10)
            .setDefaultUsers(users.map((user) => user.id))
    );
}

function createDepartmentSelectMenu(customDept: string | null, selected: string | null): ActionRowBuilder<StringSelectMenuBuilder> {
    const departmentOptionList = VerificationDepartmentList.map((dept) => {
        return new StringSelectMenuOptionBuilder()
            .setLabel(dept.name)
            .setValue(dept.name)
            .setDescription(dept.description)
            .setEmoji(dept.emoji)
            .setDefault(selected !== null ? selected === dept.name : false);
    });
    if (customDept !== null && VerificationDepartmentList.every((dept) => dept.name !== customDept)) {
        departmentOptionList.splice(
            0,
            0,
            new StringSelectMenuOptionBuilder()
                .setLabel(customDept)
                .setValue(customDept)
                .setDescription('Department name manually entered for the command')
                .setDefault(true)
        );
    }
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('verifyoverrideDepartmentSelect')
            .addOptions(departmentOptionList)
            .setPlaceholder('No department selected.')
            .setMinValues(0)
            .setMaxValues(1)
    );
}

function createYearSelectMenu(customYear: string | null, selected: string | null): ActionRowBuilder<StringSelectMenuBuilder> {
    const yearArray = [...VerificationDefaultStartingYears].map((year) => year.toString());
    if (customYear !== null) yearArray.push(customYear);
    yearArray.sort((a, b) => Number(a) - Number(b));

    const yearOptions = yearArray.map((year) => {
        return new StringSelectMenuOptionBuilder()
            .setLabel(year)
            .setValue(year)
            .setDescription(`Entered UWaterloo in ${year}`)
            .setDefault(year === selected);
    });

    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('verifyoverrideYearSelect')
            .addOptions(yearOptions)
            .setPlaceholder('No entrance year selected.')
            .setMinValues(0)
            .setMaxValues(1)
    );
}

function createConfirmCancelButtons(selectedDept: string | null, selectedYear: string | null): ActionRowBuilder<ButtonBuilder> {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`verifyoverrideContinue`)
            .setLabel('Continue')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(selectedDept === null && selectedYear === null),
        new ButtonBuilder().setCustomId(`verifyoverrideCancel`).setLabel('Cancel').setStyle(ButtonStyle.Danger)
    );
}

function renderSelectionComponents(
    users: User[],
    customDept: string | null,
    selectedDept: string | null,
    customYear: string | null,
    selectedYear: string | null
) {
    return [
        createUsersSelectMenu(users),
        createDepartmentSelectMenu(customDept, selectedDept),
        createYearSelectMenu(customYear, selectedYear),
        createConfirmCancelButtons(selectedDept, selectedYear),
    ];
}

async function renderOverrideConfirmationScreen(
    i: ButtonInteraction,
    targetUsers: User[],
    newDepartment: string | null,
    newYear: string | null
) {
    if (!i.inCachedGuild()) return;
    if (!i.deferred) await i.deferUpdate();

    const roleChangePrediction = await predictOverrideRoleChangesString(i.guild!, targetUsers, newDepartment, newYear);

    const embed = new EmbedBuilder().setColor('Orange').setTitle('Confirm Override Creation').setDescription(`
        You are creating an override for user${targetUsers.length > 1 ? 's' : ''} ${targetUsers.map((user) => user.toString()).join(', ')}.

        **Overridden Department:** ${newDepartment ? inlineCode(newDepartment) : inlineCode('not overridden')}
        **Overridden Year:** ${newYear ? inlineCode(newYear) : inlineCode('not overridden')}

        ${roleChangePrediction}

        Old roles assigned from verification will be automatically cleaned up.
    `);

    await i.editReply({ embeds: [embed], components: [] });
    return;
}

async function predictOverrideRoleChangesString(
    guild: Guild,
    targetUsers: User[],
    newDepartment: string | null,
    newYear: string | null
): Promise<string> {
    const config = await GuildConfigCache.fetchConfig(guild.id);

    if (newDepartment !== null && newYear !== null) {
        // if both values are set, we know the exact roles that will be assigned regardless of the user's current state
        const newRoles = RoleAssignmentService.getMatchingRoleData(
            {
                verified: true,
                uwid: 'verifyoverride confirm screen',
                o365CreatedDate: new Date(Number(newYear), 5),
                department: newDepartment,
            },
            config
        );
        return newRoles.length > 0
            ? `This will result in the following roles being assigned: ${newRoles.map((role) => `<@&${role.id}>`).join(', ')}`
            : 'This will result in no roles being assigned based on the current verification rules.';
    } else if (targetUsers.length === 1) {
        // if only one user is selected, we can predict the roles that will be assigned as we can retrieve their current state
        const existingUserInfo = await UserModel.findOne({ discordId: targetUsers[0].id });
        if (existingUserInfo === null) throw new Error('Partial override creation attempt for user not found in database');
        if (existingUserInfo.o365CreatedDate === undefined || existingUserInfo.department === undefined) {
            throw new Error('Partial override creation attempt for user with missing verification data');
        }

        const newRoles = RoleAssignmentService.getMatchingRoleData(
            {
                verified: true,
                uwid: 'verifyoverride confirm screen',
                o365CreatedDate: newYear !== null ? new Date(Number(newYear), 5) : existingUserInfo.o365CreatedDate,
                department: newDepartment !== null ? newDepartment : existingUserInfo.department,
            },
            config
        );
        return newRoles.length > 0
            ? `This will result in the following roles being assigned: ${newRoles.map((role) => `<@&${role.id}>`).join(', ')}`
            : 'This will result in no roles being assigned based on the current verification rules.';
    } else {
        return "The exact roles that will be assigned cannot be predicted as multiple users are selected and only one of the department or year is overridden. Thus, the roles assigned will also depend on the users' existing verification data.";
    }
}
