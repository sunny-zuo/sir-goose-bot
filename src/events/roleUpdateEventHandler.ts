import { EventHandler } from './eventHandler';
import Client from '#src/Client';
import {
    ChannelType,
    ComponentType,
    ActionRowBuilder,
    ButtonBuilder,
    MessageComponentInteraction,
    EmbedBuilder,
    PermissionsBitField,
    Role,
    ButtonStyle,
} from 'discord.js';
import { Modlog } from '#util/modlog';
import GuildConfigModel from '#models/guildConfig.model';
import ButtonRoleModel from '#models/buttonRole.model';
import { GuildConfigCache } from '#util/guildConfigCache';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '#util/logger';
import { convertButtonActionRowToBuilder } from '#util/messageComponents';

export class RoleUpdateEventHandler implements EventHandler {
    readonly eventName = 'roleUpdate';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(oldRole: Role, newRole: Role): Promise<void> {
        await this.updateVerificationRules(oldRole, newRole);
        await this.promptUpdateVerificationRules(oldRole, newRole);
        await this.updateButtonRolePrompts(oldRole, newRole);
    }

    async updateVerificationRules(oldRole: Role, newRole: Role): Promise<void> {
        if (oldRole.name === newRole.name) {
            return;
        }

        const guild = newRole.guild;
        const config = await GuildConfigModel.findOne({ guildId: guild.id });

        if (config && config.enableVerification && config.verificationRules?.rules && config.verificationRules.rules.length > 0) {
            const verificationRules = config.verificationRules.rules;

            let didRulesUpdate = false;
            for (const rule of verificationRules) {
                for (const role of rule.roles) {
                    if (role.id === oldRole.id) {
                        role.name = newRole.name;
                        didRulesUpdate = true;
                    }
                }
            }

            if (didRulesUpdate) {
                logger.info(
                    {
                        event: { name: this.eventName },
                        role: { id: newRole.id, oldName: oldRole.name, newName: newRole.name },
                        guild: { id: guild.id },
                    },
                    'Automatically updating renamed role in verification rules'
                );

                await config.save();

                await Modlog.logInfoMessage(
                    guild,
                    'Verification Role Updated',
                    `The role \`${oldRole.name}\` is used for verification, and was renamed to \`${newRole.name}\`. The server's verification rules have automatically updated to reflect this change.`,
                    'Green'
                );
            }
        }
    }

    async promptUpdateVerificationRules(oldRole: Role, newRole: Role): Promise<void> {
        // this check is in place so that this function will only be called for pseudo role creation events
        if (oldRole.name !== 'new role' || newRole.name === 'new role') return;
        // TODO: refactor to use a single method for roleUpdate and roleCreate rather than duplicating the code in checkVerificationRules
        const guild = newRole.guild;
        const config = await GuildConfigCache.fetchConfig(guild.id);

        let doesRoleNameMatch = false;

        if (config.enableVerification && config.verificationRules?.rules && config.verificationRules.rules.length > 0) {
            const verificationRules = config.verificationRules.rules;

            for (const rule of verificationRules) {
                if (!doesRoleNameMatch) {
                    doesRoleNameMatch = rule.roles.some((role) => role.name === newRole.name);
                }
            }
        }

        if (doesRoleNameMatch) {
            const embed = new EmbedBuilder()
                .setTitle('New Role Created')
                .setColor('Blue')
                .setDescription(
                    `The newly created role named \`${newRole.name}\` matches the name of a role set in verification rules. Would you like to automatically update the verification rules to assign the newly created role when the rule(s) match?`
                )
                .setTimestamp();

            const updateId = uuidv4();
            const ignoreId = uuidv4();
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId(updateId).setLabel('Update Roles').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(ignoreId).setLabel('Ignore').setStyle(ButtonStyle.Danger)
            );

            const message = await Modlog.logMessage(guild, { embeds: [embed], components: [row] });
            if (!message) return;

            const filter = (i: MessageComponentInteraction) => i.member !== undefined;
            const collector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 1000 * 60 * 5 });
            let validInteractionReceived = false;

            collector.on('collect', async (i) => {
                if (!i.inCachedGuild()) return;
                const member = i.member;

                if (!member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('You must have the `Manage Server` permission to interact with this button.');

                    await i.reply({ embeds: [embed] });
                    return;
                }

                if (i.customId === updateId) {
                    let didRulesUpdate = false;
                    const newConfig = await GuildConfigModel.findOne({ guildId: guild.id });
                    if (
                        newConfig &&
                        newConfig.enableVerification &&
                        newConfig.verificationRules?.rules &&
                        newConfig.verificationRules.rules.length > 0
                    ) {
                        const verificationRules = newConfig.verificationRules.rules;

                        for (const rule of verificationRules) {
                            for (const role of rule.roles) {
                                if (role.name === newRole.name) {
                                    role.id = newRole.id;
                                    didRulesUpdate = true;
                                }
                            }
                        }
                    }

                    if (newConfig && didRulesUpdate) {
                        await newConfig.save();

                        const updatedEmbed = new EmbedBuilder()
                            .setTitle('New Role Created')
                            .setColor('Green')
                            .setDescription(
                                `The newly created role named \`${newRole.name}\` was updated to be the role assigned in verification rules by ${i.member}.`
                            )
                            .setTimestamp();

                        await i.update({ embeds: [updatedEmbed], components: [] });
                        logger.info(
                            { event: { name: this.eventName }, role: { id: newRole.id, name: newRole.name }, guild: { id: guild.id } },
                            'Newly created role matching verification rules was automatically updated'
                        );
                        validInteractionReceived = true;
                        collector.stop();
                    }
                } else if (i.customId === ignoreId) {
                    const updatedEmbed = new EmbedBuilder()
                        .setTitle('New Role Created')
                        .setColor('Yellow')
                        .setDescription(
                            `${i.member} selected to not update the verification rules to assign the newly created role \`${newRole.name}\` when rules dictate that a role named \`${newRole.name}\` should be assigned.`
                        )
                        .setTimestamp();

                    await i.update({ embeds: [updatedEmbed], components: [] });
                    logger.info(
                        { event: { name: this.eventName }, role: { id: newRole.id, name: newRole.name }, guild: { id: guild.id } },
                        'Newly created role matching verification rules was set to not automatically update'
                    );
                    validInteractionReceived = true;
                    collector.stop();
                }
            });

            collector.on('end', async () => {
                if (!validInteractionReceived) {
                    logger.info(
                        { event: { name: this.eventName }, role: { id: newRole.id, name: newRole.name }, guild: { id: guild.id } },
                        'Prompt to update newly created role matching verification rules was ignored'
                    );

                    const embed = new EmbedBuilder()
                        .setTitle('New Role Created')
                        .setColor('Blue')
                        .setDescription(
                            `The newly created role named \`${newRole.name}\` matches the name of a role set in verification rules. No one responded to the prompt asking if verification rules should be automatically updated :(`
                        )
                        .setTimestamp();

                    await message.edit({ embeds: [embed], components: [] });
                }
            });
        }
    }

    async updateButtonRolePrompts(oldRole: Role, newRole: Role): Promise<void> {
        if (oldRole.name === newRole.name) return;
        const guild = newRole.guild;

        const prompts = await ButtonRoleModel.find({ guildId: guild.id, 'roles.id': oldRole.id });
        if (!prompts || !prompts.length) return;

        for (const prompt of prompts) {
            logger.info(
                {
                    event: { name: this.eventName },
                    role: { id: newRole.id, oldName: oldRole.name, newName: newRole.name },
                    guild: { id: guild.id },
                    document: { id: prompt._id },
                },
                'Updating renamed role in button role prompt'
            );

            prompt.roles.find((r) => r.name === oldRole.name)!.name = newRole.name;
            await prompt.save();

            const promptChannel = await guild.channels.fetch(prompt.channelId).catch(() => null);
            if (!promptChannel || promptChannel.type !== ChannelType.GuildText) continue;

            const promptMessage = await promptChannel.messages.fetch(prompt.messageId);
            if (!promptMessage) continue;

            const rowIndex = promptMessage.components.findIndex((row) =>
                row.components.some((component) => component.type === ComponentType.Button && component.customId?.includes(oldRole.id))
            );
            if (rowIndex === -1) continue;

            const colIndex = promptMessage.components[rowIndex].components.findIndex(
                (component) => component.type === ComponentType.Button && component.customId?.includes(oldRole.id)
            );
            if (colIndex === -1) continue;

            const newComponents: ActionRowBuilder<ButtonBuilder>[] = promptMessage.components.map(convertButtonActionRowToBuilder);
            newComponents[rowIndex].components.splice(
                colIndex,
                1,
                new ButtonBuilder()
                    .setLabel(newRole.name)
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId(`buttonRole|{"roleId":"${newRole.id}","_id":"${prompt._id}"}`)
            );

            await promptMessage.edit({ components: newComponents });
        }
    }
}
