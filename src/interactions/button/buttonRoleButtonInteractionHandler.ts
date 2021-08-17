import { ButtonInteraction, GuildMember, MessageEmbed, Snowflake } from 'discord.js';
import { ButtonInteractionHandler } from './buttonInteractionHandler';
import { Cooldown } from '../../helpers/cooldown';
import Client from '../../Client';

type InteractionData = {
    roleId: Snowflake;
    _id: string;
};

export class ButtonRoleButtonInteractionHandler implements ButtonInteractionHandler {
    readonly client: Client;
    readonly customId = 'buttonRole';
    readonly cooldown: Cooldown;

    constructor(client: Client) {
        this.client = client;
        this.cooldown = new Cooldown(600, 20);
    }

    async execute(interaction: ButtonInteraction, args?: string): Promise<void> {
        if (!args || !interaction.guild || !interaction.member) return;

        let argData: InteractionData;

        try {
            argData = JSON.parse(args);
        } catch (e) {
            return this.client.log.warn(`Received invalid data from button role button interaction: ${args}`);
        }

        if (!argData || !argData._id || !argData.roleId) return;

        const role = await interaction.guild.roles.fetch(argData.roleId);

        if (role) {
            if (role.editable) {
                const member = interaction.member as GuildMember;
                if (member.roles.cache.has(role.id)) {
                    const embed = new MessageEmbed().setDescription(`The role ${role.name} was successfully removed.`).setColor('YELLOW');
                    await member.roles.remove(role);
                    interaction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    const embed = new MessageEmbed().setDescription(`The role ${role.name} was successfully added.`).setColor('GREEN');
                    await member.roles.add(role);
                    interaction.reply({ embeds: [embed], ephemeral: true });
                }
            } else {
                interaction.reply({
                    content: `I do not have permission to assign the role ${role.name}. Please message a server admin to get this fixed!`,
                    ephemeral: true,
                });
            }
        } else {
            interaction.reply({
                content: `The role you tried to assign does not exist. Server admins will need to recreate the button role prompt to fix this.`,
                ephemeral: true,
            });
        }
    }
}
