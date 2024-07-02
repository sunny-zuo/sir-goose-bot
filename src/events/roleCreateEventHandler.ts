import { EventHandler } from './eventHandler';
import Client from '#src/Client';
import {
    ActionRowBuilder,
    ButtonBuilder,
    MessageComponentInteraction,
    EmbedBuilder,
    Role,
    ButtonStyle,
    ComponentType,
    PermissionFlagsBits,
} from 'discord.js';
import { Modlog } from '#util/modlog';
import { GuildConfigCache } from '#util/guildConfigCache';
import { v4 as uuidv4 } from 'uuid';
import GuildConfigModel from '#models/guildConfig.model';
import { logger } from '#util/logger';

export class RoleCreateEventHandler implements EventHandler {
    readonly eventName = 'roleCreate';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(newRole: Role): Promise<void> {
        await this.checkVerificationRules(newRole);
    }

    async checkVerificationRules(newRole: Role): Promise<void> {
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

            const updateId = `roleCreate|updateButton|${uuidv4()}`;
            const ignoreId = `roleCreate|ignoreButton|${uuidv4()}`;
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

                if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
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
}
