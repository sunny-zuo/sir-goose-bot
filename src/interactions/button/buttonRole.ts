import { ButtonInteraction, EmbedBuilder, Snowflake, inlineCode } from 'discord.js';
import { ButtonInteractionHandler } from './buttonInteractionHandler';
import { Cooldown } from '#util/cooldown';
import Client from '#src/Client';
import ButtonRoleModel from '#models/buttonRole.model';
import { logger } from '#util/logger';

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
        if (!args || !interaction.inCachedGuild()) return;
        await interaction.deferReply({ ephemeral: true }); // defer as role assginment can take more than 3 seconds during peak times

        let argData: InteractionData;

        try {
            argData = JSON.parse(args);
        } catch (e) {
            await interaction.editReply({
                content: `This button role prompt is no longer valid.`,
            });
            return logger.warn({ args }, 'Received invalid JSON from button role button interaction');
        }

        if (!argData || !argData._id || !argData.roleId) return;

        const buttonRoleInfo = await ButtonRoleModel.findById(argData._id);

        if (!buttonRoleInfo || buttonRoleInfo.roles.every((roleData) => roleData.id !== argData.roleId)) {
            await interaction.editReply({
                content: `This button role prompt is no longer valid.`,
            });
            return logger.warn({ args }, 'Button role button interaction had invalid data');
        }

        const role = await interaction.guild.roles.fetch(argData.roleId);

        if (role) {
            if (role.editable) {
                const member = interaction.member;
                if (member.roles.cache.has(role.id)) {
                    const embed = new EmbedBuilder()
                        .setDescription(`The role ${inlineCode(role.name)} was successfully removed.`)
                        .setColor('Yellow');
                    await member.roles.remove(role);
                    await interaction.editReply({ embeds: [embed] });
                } else {
                    const embed = new EmbedBuilder()
                        .setDescription(`The role ${inlineCode(role.name)} was successfully added.`)
                        .setColor('Green');
                    await member.roles.add(role);
                    await interaction.editReply({ embeds: [embed] });
                }
            } else {
                await interaction.editReply({
                    content: `I do not have permission to assign the role ${inlineCode(
                        role.name
                    )}. Please message a server admin to get this fixed!`,
                });
            }
        } else {
            await interaction.editReply({
                content: `The role you tried to assign does not exist. Server admins will need to recreate the button role prompt to fix this.`,
            });
        }
    }
}
