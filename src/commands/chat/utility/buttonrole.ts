import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import {
    ApplicationCommandOption,
    ApplicationCommandNonOptionsData,
    CommandInteractionOptionResolver,
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    PermissionsBitField,
    Role,
    ApplicationCommandOptionType,
    ButtonStyle,
    ChannelType,
    ComponentType,
    inlineCode,
    ChatInputCommandInteraction,
} from 'discord.js';
import ButtonRoleModel from '#models/buttonRole.model';
import { sendEphemeralReply } from '#util/message';
import { logger } from '#util/logger';
import { convertButtonActionRowToBuilder } from '#util/messageComponents';

const BUTTON_ROLE_GUILD_LIMIT = 50;
const BUTTON_ROLE_ROLE_LIMIT = 24;

export class ButtonRole extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'create',
            description: 'Create a button role prompt',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'message',
                    description: 'Message to send with the prompt',
                    type: ApplicationCommandOptionType.String,
                },
                ...ButtonRole.createRoleOptions(BUTTON_ROLE_ROLE_LIMIT),
            ],
        },
        {
            name: 'edit',
            description: 'Edit a button role prompt',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'message_id',
                    description: 'The message id of the button role prompt to edit',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: 'action',
                    description: 'Action to perform',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        { name: 'Add Role', value: 'add' },
                        { name: 'Remove Role', value: 'remove' },
                    ],
                },
                {
                    name: 'role',
                    description: 'Role to add or remove',
                    type: ApplicationCommandOptionType.Role,
                    required: true,
                },
                {
                    name: 'row',
                    description: 'Row to add the role to. Does nothing for removal.',
                    type: ApplicationCommandOptionType.Number,
                    choices: [
                        { name: 'Row 1', value: 0 },
                        { name: 'Row 2', value: 1 },
                        { name: 'Row 3', value: 2 },
                        { name: 'Row 4', value: 3 },
                        { name: 'Row 5', value: 4 },
                    ],
                },
            ],
        },
    ];

    constructor(client: Client) {
        super(client, {
            name: 'buttonrole',
            description: 'Create a prompt allowing users to self assign roles using buttons.',
            category: 'Utility',
            isTextCommand: false,
            options: ButtonRole.options,
            guildOnly: true,
            examples: ['message @role1 @role2 @role3'],
            clientPermissions: [PermissionsBitField.Flags.ManageRoles],
            userPermissions: [PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.ManageGuild],
            cooldownSeconds: 600,
            cooldownMaxUses: 12,
        });
    }

    async execute(
        interaction: ChatInputCommandInteraction,
        args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const subcommand = args.getSubcommand();
        switch (subcommand) {
            case 'create':
                await this.create(interaction, args);
                break;
            case 'edit':
                await this.edit(interaction, args);
                break;
            default:
                logger.error(args.data, 'Invalid subcommand provided for buttonrole creation');
        }
    }

    async create(
        interaction: ChatInputCommandInteraction,
        args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        if (!interaction.guildId) return;

        const roles: Role[][] = [[], [], [], [], []]; // 3 rows of up to 5 roles each
        const invalidRoles: Role[] = [];

        for (let i = 1; i <= BUTTON_ROLE_ROLE_LIMIT; i++) {
            const role = args?.getRole(`role${i}`);
            if (role && role.id !== interaction.guild!.roles.everyone.id && !roles.flat().some((r) => r.id === role.id)) {
                const fullRole = role as Role;
                if (fullRole.editable) {
                    roles[Math.ceil(i / 5) - 1].push(fullRole);
                } else {
                    invalidRoles.push(fullRole);
                }
            }
        }

        if (invalidRoles.length > 0) {
            await this.sendErrorEmbed(
                interaction,
                'Invalid Roles',
                `I do not have permission to assign the following roles: ${invalidRoles.map((r) => inlineCode(r.name)).join(', ')}`
            );
            return;
        }
        if (roles.length === 0) {
            await this.sendErrorEmbed(
                interaction,
                'Invalid Roles',
                'No valid roles to assign were specified. Make sure at least one role is selected when executing the command.'
            );
            return;
        }

        const existingButtonRoles = await ButtonRoleModel.countDocuments({ guildId: interaction.guildId });
        if (existingButtonRoles > BUTTON_ROLE_GUILD_LIMIT) {
            await this.sendErrorEmbed(
                interaction,
                'Too Many Button Role Prompts',
                `You cannot have more than ${BUTTON_ROLE_GUILD_LIMIT} button roles prompts. Please ask in the [support server](https://discord.gg/KHByMmrrw2) if you have a good reason to get this limit increased.`
            );
            return;
        }

        const buttonRoleDoc = await ButtonRoleModel.create({
            guildId: interaction.guildId,
            channelId: interaction.channelId,
            messageId: '-1',
            roles: roles.flat().map((r) => ({ name: r.name, id: r.id })),
        });

        const components: ActionRowBuilder<ButtonBuilder>[] = [];
        for (const roleRow of roles) {
            const componentRow = new ActionRowBuilder<ButtonBuilder>();
            for (const role of roleRow) {
                componentRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`buttonRole|{"roleId":"${role.id}","_id":"${buttonRoleDoc._id}"}`)
                        .setLabel(role.name)
                        .setStyle(ButtonStyle.Primary)
                );
            }

            if (componentRow.components.length > 0) {
                components.push(componentRow);
            }
        }

        const embed = new EmbedBuilder()
            .setDescription(
                args?.getString('message') ??
                    "Select role(s) to add/remove. The button will add the role if you don't have it, and remove it if you do."
            )
            .setColor('#2F3136');

        const channel = interaction.channel ?? (await interaction.guild?.channels.fetch(interaction.channelId).catch(() => null));
        if (channel?.type !== ChannelType.GuildText) return;

        const message = await channel.send({ embeds: [embed], components });
        await interaction.reply({ content: 'Button role prompt successfully created!', ephemeral: true });

        buttonRoleDoc.messageId = message.id;
        await buttonRoleDoc.save();
    }

    async edit(
        interaction: ChatInputCommandInteraction,
        args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        if (!interaction.guildId) return;

        const buttonRole = await ButtonRoleModel.findOne({ guildId: interaction.guildId, messageId: args.getString('message_id', true) });
        if (!buttonRole) {
            await this.sendErrorEmbed(
                interaction,
                'Button Role Prompt Not Found',
                'The specified button role prompt could not be found. Please check that the provided message id is a button role prompt sent by Sir Goose.',
                true
            );
            return;
        }

        const channel = await interaction.guild?.channels.fetch(buttonRole.channelId).catch(() => null);
        if (channel?.type !== ChannelType.GuildText) {
            await this.sendErrorEmbed(
                interaction,
                'Invalid Channel',
                'The channel associated with this button role prompt could not be found, or is invalid. Please check that the provided message id is correct and that the bot has access to the channel where the message is.',
                true
            );
            return;
        }
        const message = await channel.messages.fetch(buttonRole.messageId);
        if (!message || message.author.id !== this.client.user?.id) {
            await this.sendErrorEmbed(
                interaction,
                'Invalid Message',
                'The message associated with this button role prompt could not be found, or is invalid. Please check that the provided message id is correct and that the bot has access to the channel where the message is.',
                true
            );
            return;
        }

        const role = args.getRole('role', true) as Role;
        if (role.id === interaction.guild!.roles.everyone.id) {
            await this.sendErrorEmbed(
                interaction,
                'Invalid Role',
                `The role you specified is the ${inlineCode('@everyone')} role. Please specify a valid role.`,
                true
            );
            return;
        }

        if (args.getString('action', true) === 'add') {
            if (buttonRole.roles.some((r) => r.id === role.id)) {
                await this.sendErrorEmbed(
                    interaction,
                    'Role Already Added',
                    `The role ${inlineCode(role.name)} is already added to this button role prompt.`,
                    true
                );
                return;
            }

            const lowestUnfilledIndex = message.components.findIndex((c) => c.components.length < 5);
            const lowestUnfilledRow = lowestUnfilledIndex !== -1 ? lowestUnfilledIndex + 1 : undefined;

            const selectedRow = args.getNumber('row') ?? lowestUnfilledRow ?? message.components.length;

            let errorMessage: string | undefined;
            if (selectedRow < 0) errorMessage = 'An invalid row was selected.';
            else if (selectedRow > 4) errorMessage = 'You cannot have more than 25 roles to a single button role prompt.';
            else if (message.components[selectedRow]?.components.length >= 5) errorMessage = 'You cannot add more than 5 roles per row.';

            if (errorMessage) {
                await this.sendErrorEmbed(interaction, 'Button Role Update Error', errorMessage, true);
                return;
            }

            const newComponents: ActionRowBuilder<ButtonBuilder>[] = message.components.map(convertButtonActionRowToBuilder);

            const button = new ButtonBuilder()
                .setCustomId(`buttonRole|{"roleId":"${role.id}","_id":"${buttonRole._id}"}`)
                .setLabel(role.name)
                .setStyle(ButtonStyle.Primary);
            message.components[selectedRow]
                ? newComponents[selectedRow].addComponents(button)
                : newComponents.push(new ActionRowBuilder<ButtonBuilder>().addComponents(button));

            buttonRole.roles.push({ name: role.name, id: role.id });

            await buttonRole.save();
            await message.edit({ components: message.components });
            await sendEphemeralReply(
                interaction,
                { content: `The role "${role.name}" has been successfully added to the button role prompt!` },
                20
            );
        } else if (args.getString('action', true) === 'remove') {
            if (!buttonRole.roles.some((r) => r.id === role.id)) {
                await this.sendErrorEmbed(
                    interaction,
                    'Role Does Not Exist',
                    `The role ${inlineCode(role.name)} is not part of the button role prompt.`,
                    true
                );
                return;
            }

            const rowIndex = message.components.findIndex((row) =>
                row.components.some((component) => component.type === ComponentType.Button && component.customId?.includes(role.id))
            );
            if (rowIndex === -1) {
                throw new Error(
                    `Attempted to remove a role ${role.id} from a button role prompt (${buttonRole._id}) where the id does not belong to a button`
                );
            }

            const colIndex = message.components[rowIndex].components.findIndex(
                (component) => component.type === ComponentType.Button && component.customId?.includes(role.id)
            );
            if (colIndex === -1) {
                throw new Error(
                    `Attempted to remove a role ${role.id} from a button role prompt (${buttonRole._id}) where the id does not belong to a button`
                );
            }

            const newComponents: ActionRowBuilder<ButtonBuilder>[] = message.components.map(convertButtonActionRowToBuilder);
            newComponents[rowIndex].components.splice(colIndex, 1);

            const cleanComponents = newComponents.filter((component) => component.components.length !== 0);
            await message.edit({ components: cleanComponents });

            buttonRole.roles = buttonRole.roles.filter((r) => r.id !== role.id);
            await buttonRole.save();

            await sendEphemeralReply(
                interaction,
                { content: `The role "${role.name}" has been successfully removed from the button role prompt.` },
                20
            );
        }
    }

    private static createRoleOptions(count: number): ApplicationCommandNonOptionsData[] & ApplicationCommandOption[] {
        const options: ApplicationCommandNonOptionsData[] & ApplicationCommandOption[] = [];
        for (let i = 1; i <= count; i++) {
            options.push({
                name: `role${i}`,
                description: `Role ${i} (Row ${Math.ceil(i / 5)})`,
                type: ApplicationCommandOptionType.Role,
            });
        }

        return options;
    }
}
