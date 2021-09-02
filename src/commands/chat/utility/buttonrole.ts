import { ChatCommand } from '../ChatCommand';
import Client from '../../../Client';
import {
    ApplicationCommandOption,
    ApplicationCommandNonOptionsData,
    CommandInteraction,
    CommandInteractionOptionResolver,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    Permissions,
    Role,
} from 'discord.js';
import { inlineCode } from '@discordjs/builders';
import ButtonRoleModel from '../../../models/buttonRole.model';
import { GuildConfigCache } from '../../../helpers/guildConfigCache';
import { sendEphemeralReply } from '../../../helpers/message';

const BUTTON_ROLE_GUILD_LIMIT = 15;
const BUTTON_ROLE_ROLE_LIMIT = 24;

export class ButtonRole extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'create',
            description: 'Create a button role prompt',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'message',
                    description: 'Message to send with the prompt',
                    type: 'STRING',
                },
                ...ButtonRole.createRoleOptions(BUTTON_ROLE_ROLE_LIMIT),
            ],
        },
        {
            name: 'edit',
            description: 'Edit a button role prompt',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'message_id',
                    description: 'The message id of the button role prompt to edit',
                    type: 'STRING',
                    required: true,
                },
                {
                    name: 'action',
                    description: 'Action to perform',
                    type: 'STRING',
                    required: true,
                    choices: [
                        { name: 'Add Role', value: 'add' },
                        { name: 'Remove Role', value: 'remove' },
                    ],
                },
                {
                    name: 'role',
                    description: 'Role to add or remove',
                    type: 'ROLE',
                    required: true,
                },
                {
                    name: 'row',
                    description: 'Row to add the role to. Does nothing for removal.',
                    type: 'NUMBER',
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
            options: ButtonRole.options,
            guildOnly: true,
            examples: ['@role1 @role2 @role3'],
            clientPermissions: [Permissions.FLAGS.MANAGE_ROLES],
            userPermissions: [Permissions.FLAGS.MANAGE_ROLES, Permissions.FLAGS.MANAGE_GUILD],
            cooldownSeconds: 600,
            cooldownMaxUses: 12,
        });
    }

    async execute(interaction: Message | CommandInteraction, args?: CommandInteractionOptionResolver): Promise<void> {
        const config = await GuildConfigCache.fetchConfig(interaction.guild?.id);
        if (!args) {
            return this.sendErrorEmbed(
                interaction,
                'Option Missing',
                `No option was specified. Use slash commands or ${inlineCode(`${config.prefix}help buttonrole`)} for usage information.`
            );
        }

        if (args.getSubcommand() === 'create') {
            return this.create(interaction, args);
        } else if (args.getSubcommand() === 'edit') {
            return this.edit(interaction, args);
        }
    }

    async create(interaction: Message | CommandInteraction, args: CommandInteractionOptionResolver): Promise<void> {
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
            return this.sendErrorEmbed(
                interaction,
                'Invalid Roles',
                `I do not have permission to assign the following roles: ${invalidRoles.map((r) => inlineCode(r.name)).join(', ')}`
            );
        }
        if (roles.length === 0) {
            return this.sendErrorEmbed(
                interaction,
                'Invalid Roles',
                'No valid roles to assign were specified. Make sure the role is mentioned (or use slash commands) for role selection.'
            );
        }

        const existingButtonRoles = await ButtonRoleModel.countDocuments({ guildId: interaction.guildId });
        if (existingButtonRoles > BUTTON_ROLE_GUILD_LIMIT) {
            return this.sendErrorEmbed(
                interaction,
                'Too Many Button Role Prompts',
                `You cannot have more than ${BUTTON_ROLE_GUILD_LIMIT} button roles prompts. Please message ${process.env.OWNER_DISCORD_USERNAME} if you have a good reason to get this limit increased.`
            );
        }

        const buttonRoleDoc = await ButtonRoleModel.create({
            guildId: interaction.guildId,
            channelId: interaction.channelId,
            messageId: '-1',
            roles: roles.flat().map((r) => ({ name: r.name, id: r.id })),
        });

        const components: MessageActionRow[] = [];
        for (const roleRow of roles) {
            const componentRow = new MessageActionRow();
            for (const role of roleRow) {
                componentRow.addComponents(
                    new MessageButton()
                        .setCustomId(`buttonRole|{"roleId":"${role.id}","_id":"${buttonRoleDoc._id}"}`)
                        .setLabel(role.name)
                        .setStyle('PRIMARY')
                );
            }

            if (componentRow.components.length > 0) {
                components.push(componentRow);
            }
        }

        const embed = new MessageEmbed()
            .setDescription(
                args?.getString('message') ??
                    "Select role(s) to add/remove. The button will add the role if you don't have it, and remove it if you do."
            )
            .setColor('#2F3136');

        let message: Message;

        if (this.isMessage(interaction)) {
            message = await interaction.channel.send({ embeds: [embed], components });
        } else {
            const channel = interaction.channel ?? (await interaction.guild?.channels.fetch(interaction.channelId));
            if (!channel?.isText()) return;

            message = await channel.send({ embeds: [embed], components });
            interaction.reply({ content: 'Button role prompt successfully created!', ephemeral: true });
        }

        buttonRoleDoc.messageId = message.id;
        buttonRoleDoc.save();
    }

    async edit(interaction: Message | CommandInteraction, args: CommandInteractionOptionResolver): Promise<void> {
        if (!interaction.guildId) return;

        const buttonRole = await ButtonRoleModel.findOne({ guildId: interaction.guildId, messageId: args.getString('message_id', true) });
        if (!buttonRole) {
            return this.sendErrorEmbed(
                interaction,
                'Button Role Prompt Not Found',
                'The specified button role prompt could not be found. Please check that the provided message id is a button role prompt sent by Sir Goose.',
                true
            );
        }

        const channel = await interaction.guild?.channels.fetch(buttonRole.channelId);
        if (!channel?.isText()) {
            return this.sendErrorEmbed(
                interaction,
                'Invalid Channel',
                'The channel associated with this button role prompt could not be found, or is invalid. Please check that the provided message id is correct and that the bot has access to the channel where the message is.',
                true
            );
        }
        const message = await channel.messages.fetch(buttonRole.messageId);
        if (!message || message.author.id !== this.client.user?.id) {
            return this.sendErrorEmbed(
                interaction,
                'Invalid Message',
                'The message associated with this button role prompt could not be found, or is invalid. Please check that the provided message id is correct and that the bot has access to the channel where the message is.',
                true
            );
        }

        const role = args.getRole('role', true) as Role;
        if (role.id === interaction.guild!.roles.everyone.id) {
            return this.sendErrorEmbed(
                interaction,
                'Invalid Role',
                `The role you specified is the ${inlineCode('@everyone')} role. Please specify a valid role.`,
                true
            );
        }

        if (args.getString('action', true) === 'add') {
            if (buttonRole.roles.some((r) => r.id === role.id)) {
                return this.sendErrorEmbed(
                    interaction,
                    'Role Already Added',
                    `The role ${inlineCode(role.name)} is already added to this button role prompt.`,
                    true
                );
            }

            const lowestUnfilledIndex = message.components.findIndex((c) => c.components.length < 5);
            const lowestUnfilledRow = lowestUnfilledIndex !== -1 ? lowestUnfilledIndex + 1 : undefined;

            const selectedRow = args.getNumber('row') ?? lowestUnfilledRow ?? message.components.length;

            let errorMessage: string | undefined;
            if (selectedRow < 0) errorMessage = 'An invalid row was selected.';
            else if (selectedRow > 4) errorMessage = 'You cannot have more than 25 roles to a single button role prompt.';
            else if (message.components[selectedRow]?.components.length >= 5) errorMessage = 'You cannot add more than 5 roles per row.';

            if (errorMessage) {
                return this.sendErrorEmbed(interaction, 'Button Role Update Error', errorMessage, true);
            }

            const button = new MessageButton()
                .setCustomId(`buttonRole|{"roleId":"${role.id}","_id":"${buttonRole._id}"}`)
                .setLabel(role.name)
                .setStyle('PRIMARY');
            message.components[selectedRow]
                ? message.components[selectedRow].addComponents(button)
                : message.components.push(new MessageActionRow().addComponents(button));

            buttonRole.roles.push({ name: role.name, id: role.id });

            await buttonRole.save();
            await message.edit({ components: message.components });
            await sendEphemeralReply(interaction, { content: 'Button role prompt updated successfully!' }, 20);
        } else if (args.getString('action', true) === 'remove') {
            this.sendErrorEmbed(
                interaction,
                'Not Implemented',
                'Removing a role from a button prompt is currently not implemented, but is expected to be added very soon.',
                true
            );
        }
    }

    private static createRoleOptions(count: number): ApplicationCommandNonOptionsData[] & ApplicationCommandOption[] {
        const options: ApplicationCommandNonOptionsData[] & ApplicationCommandOption[] = [];
        for (let i = 1; i <= count; i++) {
            options.push({
                name: `role${i}`,
                description: `Role ${i} (Row ${Math.ceil(i / 5)})`,
                type: 'ROLE',
            });
        }

        return options;
    }
}
