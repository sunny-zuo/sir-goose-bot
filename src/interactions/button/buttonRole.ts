import { ButtonInteraction, GuildMember, MessageEmbed, Snowflake } from 'discord.js';
import { ButtonInteractionHandler } from './buttonInteractionHandler';
import { Cooldown } from '../../helpers/cooldown';
import Client from '../../Client';
import { inlineCode } from '@discordjs/builders';
import ButtonRoleModel from '../../models/buttonRole.model';

type InteractionData = {
    roleId: Snowflake;
    _id: string;
};

export class ButtonRole implements ButtonInteractionHandler {
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
            await interaction.reply({
                content: `This button role prompt is no longer valid.`,
                ephemeral: true,
            });
            return this.client.log.warn(`Received invalid JSON from button role button interaction: ${args}`);
        }

        if (!argData || !argData._id || !argData.roleId) return;

        const buttonRoleInfo = await ButtonRoleModel.findById(argData._id);

        if (!buttonRoleInfo || buttonRoleInfo.roles.every((roleData) => roleData.id !== argData.roleId)) {
            await interaction.reply({
                content: `This button role prompt is no longer valid.`,
                ephemeral: true,
            });
            return this.client.log.warn(`Button role button interaction had invalid data: ${args}`);
        }

        const role = await interaction.guild.roles.fetch(argData.roleId);

        if (role) {
            if (role.editable) {
                const member = interaction.member as GuildMember;
                if (member.roles.cache.has(role.id)) {
                    const embed = new MessageEmbed()
                        .setDescription(`The role ${inlineCode(role.name)} was successfully removed.`)
                        .setColor('YELLOW');
                    await member.roles.remove(role);
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    const embed = new MessageEmbed()
                        .setDescription(`The role ${inlineCode(role.name)} was successfully added.`)
                        .setColor('GREEN');
                    await member.roles.add(role);
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                }
            } else {
                await interaction.reply({
                    content: `I do not have permission to assign the role ${inlineCode(
                        role.name
                    )}. Please message a server admin to get this fixed!`,
                    ephemeral: true,
                });
            }
        } else {
            await interaction.reply({
                content: `The role you tried to assign does not exist. Server admins will need to recreate the button role prompt to fix this.`,
                ephemeral: true,
            });
        }
    }
}
