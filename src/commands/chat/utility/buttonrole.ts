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
import { chunk } from '../../../helpers/array';
import { inlineCode } from '@discordjs/builders';
import ButtonRoleModel from '../../../models/buttonRole.model';

const BUTTON_ROLE_GUILD_LIMIT = 15;

export class ButtonRole extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'create',
            description: 'Create a button role prompt',
            type: 'SUB_COMMAND',
            options: [
                ...ButtonRole.createRoleOptions(10),
                {
                    name: 'message',
                    description: 'Message to send with the prompt',
                    type: 'STRING',
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
        if (!interaction.guildId) return;
        const roles: Role[] = [];
        const invalidRoles: Role[] = [];

        for (let i = 1; i <= 10; i++) {
            const role = args?.getRole(`role${i}`);
            if (role && role.id !== interaction.guild!.roles.everyone.id && !roles.some((r) => r.id === role.id)) {
                const fullRole = role as Role;
                if (fullRole.editable) {
                    roles.push(fullRole);
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
            roles: roles.map((r) => ({ name: r.name, id: r.id })),
        });

        const components: MessageActionRow[] = [];
        for (const roleChunk of chunk(roles, 5)) {
            const row = new MessageActionRow();
            for (const role of roleChunk) {
                row.addComponents(
                    new MessageButton()
                        .setCustomId(`buttonRole|{"roleId":"${role.id}","_id":"${buttonRoleDoc._id}"}`)
                        .setLabel(role.name)
                        .setStyle('PRIMARY')
                );
            }
            components.push(row);
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

    private static createRoleOptions(count: number): ApplicationCommandNonOptionsData[] & ApplicationCommandOption[] {
        const options: ApplicationCommandNonOptionsData[] & ApplicationCommandOption[] = [];
        for (let i = 1; i <= count; i++) {
            options.push({
                name: `role${i}`,
                description: `Role ${i}`,
                type: 'ROLE',
            });
        }

        return options;
    }
}
