import {
    ChatInputCommandInteraction,
    ButtonInteraction,
    PermissionsBitField,
    EmbedBuilder,
    Role,
    GuildMember,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    RoleSelectMenuBuilder,
} from 'discord.js';
import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import { logger } from '#util/logger';

export class BulkRoleModify extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'bulkrolemodify',
            description: 'Bulk modify user roles based on filters',
            category: 'Utility',
            cooldownSeconds: 3600,
            cooldownMaxUses: 6,
            isTextCommand: false,
            isSlashCommand: true,
            clientPermissions: [PermissionsBitField.Flags.ManageRoles],
            userPermissions: [PermissionsBitField.Flags.Administrator],
        });
    }

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) return;
        await interaction.deferReply();

        /* Create the bulk role modification interface */
        const filterMenu = new RoleSelectMenuBuilder()
            .setCustomId('rolereplaceFilter')
            .setPlaceholder('Select roles to filter users by')
            .setMinValues(1)
            .setMaxValues(25);
        const addMenu = new RoleSelectMenuBuilder()
            .setCustomId('rolereplaceAdd')
            .setPlaceholder('Select roles to add (optional)')
            .setMinValues(0)
            .setMaxValues(25);
        const removeMenu = new RoleSelectMenuBuilder()
            .setCustomId('rolereplaceRemove')
            .setPlaceholder('Select roles to remove (optional)')
            .setMinValues(0)
            .setMaxValues(25);

        const actionRowFilter = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(filterMenu);
        const actionRowAdd = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(addMenu);
        const actionRowRemove = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(removeMenu);
        const getContinueRow = () =>
            new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                    .setCustomId('rolereplaceContinue')
                    .setLabel('Continue')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(!(selectedFilter.length > 0 && (selectedAdd.length > 0 || selectedRemove.length > 0))),
                new ButtonBuilder().setCustomId('rolereplaceCancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
            );

        let selectedFilter: string[] = []; // snowflake array of role IDs
        let selectedAdd: string[] = [];
        let selectedRemove: string[] = [];

        const embed = new EmbedBuilder()
            .setTitle('Bulk Role Modification')
            .setDescription(
                `This tool allows you to bulk modify user roles. Use if you want to change roles for multiple users at once.

                **How it works:**
1. Select the roles to filter users by. Only users that have all of these roles will be affected.
2. Select the roles to add to those users (optional).
3. Select the roles to remove from those users (optional).
4. Click confirm to preview and apply changes, or cancel to abort.
                `
            )
            .setColor('Blue');

        const message = await interaction.editReply({
            embeds: [embed],
            components: [actionRowFilter, actionRowAdd, actionRowRemove, getContinueRow()],
        });

        let finished = false;
        while (!finished) {
            try {
                const i = await message.awaitMessageComponent({
                    filter: (i) => i.user.id === interaction.user.id,
                    time: 1000 * 60 * 5,
                });
                if (i.isRoleSelectMenu()) {
                    if (i.customId === 'rolereplaceFilter') selectedFilter = i.values;
                    if (i.customId === 'rolereplaceAdd') selectedAdd = i.values;
                    if (i.customId === 'rolereplaceRemove') selectedRemove = i.values;
                    await i.update({
                        embeds: [
                            embed.setDescription(`This tool allows you to bulk modify user roles. Use if you want to change roles for multiple users at once.

                            **Selected filter roles:** ${
                                selectedFilter.length ? selectedFilter.map((id) => `<@&${id}>`).join(', ') : 'None'
                            }
                            **Roles to add:** ${selectedAdd.length ? selectedAdd.map((id) => `<@&${id}>`).join(', ') : 'None'}
                            **Roles to remove:** ${selectedRemove.length ? selectedRemove.map((id) => `<@&${id}>`).join(', ') : 'None'}

                            Click continue to preview and apply changes, or cancel to abort.`),
                        ],
                        components: [actionRowFilter, actionRowAdd, actionRowRemove, getContinueRow()],
                    });
                } else if (i.isButton()) {
                    if (i.customId === 'rolereplaceCancel') {
                        await i.update({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription('Bulk role modification cancelled, so no changes were made.')
                                    .setColor('Grey'),
                            ],
                            components: [],
                        });
                        finished = true;
                        break;
                    }
                    if (i.customId === 'rolereplaceContinue') {
                        await i.deferUpdate();
                        await this.handleConfirmation(i, selectedFilter, selectedAdd, selectedRemove);
                        finished = true;
                        break;
                    }
                }
            } catch (e) {
                if (e.name === 'Error [InteractionCollectorError]') {
                    const embed = new EmbedBuilder()
                        .setDescription('No bulk role modification confirmation was received in time, so no changes were made.')
                        .setColor('Grey');
                    await message.edit({ embeds: [embed], components: [] });
                } else {
                    throw e;
                }
                finished = true;
            }
        }
    }

    async handleConfirmation(interaction: ButtonInteraction, filterIds: string[], addIds: string[], removeIds: string[]) {
        if (!interaction.guild) return;

        await interaction.guild.members.fetch();
        const filterRoles = filterIds.map((id) => interaction.guild!.roles.cache.get(id)).filter(Boolean) as Role[];
        const addRoles = addIds.map((id) => interaction.guild!.roles.cache.get(id)).filter(Boolean) as Role[];
        const removeRoles = removeIds.map((id) => interaction.guild!.roles.cache.get(id)).filter(Boolean) as Role[];

        // Check bot can manage these roles
        const botMember = interaction.guild.members.me;
        for (const role of [...addRoles, ...removeRoles]) {
            if (role.position >= botMember!.roles.highest.position) {
                const embed = new EmbedBuilder()
                    .setDescription(
                        `I do not have permission to manage the role ${role}. Please ensure the role hierarchy is correct and permissions are configured correctly, and then try again.`
                    )
                    .setColor('Yellow');
                await interaction.editReply({ embeds: [embed], components: [] });
                return;
            }
        }

        const members =
            filterRoles.length > 0
                ? interaction.guild.members.cache.filter((m) => filterRoles.every((r) => m.roles.cache.has(r.id)))
                : interaction.guild.members.cache;

        const affectedCount = members.size;

        let actionSummary = '';
        if (removeRoles.length > 0)
            actionSummary += `The following role(s) will be removed from these users: ${removeRoles.map((r) => `${r}`).join(', ')}\n`;
        if (addRoles.length > 0)
            actionSummary += `The following role(s) will be added to these users: ${addRoles.map((r) => `${r}`).join(', ')}\n`;
        if (removeRoles.length === 0 && addRoles.length === 0)
            actionSummary = 'No role modifications were selected, so no changes will be made.\n';

        const confirmEmbed = new EmbedBuilder()
            .setTitle('Confirm Bulk Role Modification')
            .setDescription(
                `You are about to modify roles for approximately **${affectedCount}** users ${
                    filterRoles.length
                        ? 'that have the following roles: ' + filterRoles.map((r) => `${r}`).join(', ')
                        : '(all users in the server)'
                }
                
                \n${actionSummary}\nAre you sure you want to continue? This action cannot be undone.`
            )
            .setColor('Orange');
        const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('rolereplaceFinalConfirm').setLabel('Confirm').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('rolereplaceFinalCancel').setLabel('Cancel').setStyle(ButtonStyle.Danger)
        );
        const message = await interaction.editReply({ embeds: [confirmEmbed], components: [confirmRow] });

        await message
            .awaitMessageComponent({
                filter: (i) =>
                    i.isButton() &&
                    i.user.id === interaction.user.id &&
                    ['rolereplaceFinalConfirm', 'rolereplaceFinalCancel'].includes(i.customId),
                time: 60 * 1000 * 5,
            })
            .then(async (i) => {
                if (!i.isButton()) return;

                switch (i.customId) {
                    case 'rolereplaceFinalConfirm': {
                        const embed = new EmbedBuilder()
                            .setDescription(
                                `**Starting bulk role modifications...**\n
                        This will impact approximately ${affectedCount} users ${
                                    filterRoles.length
                                        ? 'that have all of the following roles: ' + filterRoles.map((r) => `${r}`).join(', ')
                                        : '(all users in the server)'
                                }
                        \n${actionSummary}
                        `
                            )
                            .setColor('Blue');

                        await i.update({ embeds: [embed], components: [] });
                        await BulkRoleModify.bulkModifyRoles(i, members, removeRoles, addRoles);
                        break;
                    }
                    case 'rolereplaceFinalCancel':
                        await i.update({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription('Bulk role modification cancelled, so no changes were made.')
                                    .setColor('Grey'),
                            ],
                            components: [],
                        });
                        return;
                    default:
                        throw new Error('Invalid rolereplace option selected');
                }
            })
            .catch(async (e) => {
                if (e.name === 'Error [InteractionCollectorError]') {
                    const embed = new EmbedBuilder()
                        .setDescription('No bulk role modification confirmation was received in time, so no changes were made.')
                        .setColor('Grey');
                    await message.edit({ embeds: [embed], components: [] });
                } else {
                    throw e;
                }
            });
    }

    static async bulkModifyRoles(interaction: ButtonInteraction, members: Map<string, GuildMember>, removeRoles: Role[], addRoles: Role[]) {
        let progress = 0;
        const total = members.size;
        const embed = this.generateProgressEmbed(progress, total);
        const message = await interaction.followUp({ embeds: [embed] });
        const updateInterval = setInterval(async () => {
            await message.edit({ embeds: [this.generateProgressEmbed(progress, total)] });
        }, 8000);
        try {
            for (const member of members.values()) {
                try {
                    let newRoles = member.roles.cache.map((r) => r.id);
                    let changesMade = false;

                    if (removeRoles.length > 0) {
                        newRoles = newRoles.filter((id) => !removeRoles.some((r) => r.id === id));
                        if (newRoles.length !== member.roles.cache.size) {
                            changesMade = true;
                        }
                    }
                    addRoles.forEach((role) => {
                        if (!newRoles.includes(role.id)) {
                            newRoles.push(role.id);
                            changesMade = true;
                        }
                    });

                    if (changesMade) {
                        await member.roles.set(newRoles);
                    }
                } catch (e) {
                    logger.error(e, `Failed to modify roles for ${member.user.tag}`);
                }
                progress++;
                await new Promise((res) => setTimeout(res, 3000));
            }
        } catch (e) {
            clearInterval(updateInterval);
            logger.error(e, 'Unknown error in bulkModifyRoles');
            await message.edit({
                embeds: [
                    new EmbedBuilder().setTitle('Error').setDescription('An error occurred during role modification.').setColor('Red'),
                ],
            });
            return;
        }
        clearInterval(updateInterval);
        await message.edit({ embeds: [this.generateProgressEmbed(progress, total)] });
    }

    private static generateProgressEmbed(progress: number, total: number): EmbedBuilder {
        const width = 20;
        const complete = Math.floor((progress / total) * width);
        return new EmbedBuilder()
            .setTitle(progress !== total ? `Modifying roles for ${total} users...` : `All ${total} users processed!`)
            .setDescription(`**Progress:**\n${'█'.repeat(complete)}${'░'.repeat(width - complete)} (${progress}/${total})`)
            .setColor(progress === total ? 'Green' : 'Blue');
    }
}
