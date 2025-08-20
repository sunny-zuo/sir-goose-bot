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
    inlineCode,
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
        await RoleCreateEventHandler.checkNewRoleRuleUpdate(this.eventName, newRole);
    }

    static async checkNewRoleRuleUpdate(eventName: string, newRole: Role): Promise<void> {
        const guild = newRole.guild;
        const config = await GuildConfigCache.fetchConfig(guild.id);

        let doesRoleNameMatch = false;

        if (config.enableVerification && config.verificationRules?.rules && config.verificationRules.rules.length > 0) {
            const rules = config.verificationRules.rules;

            for (const rule of rules) {
                if (!doesRoleNameMatch) {
                    doesRoleNameMatch = rule.roles.some((role) => role.name === newRole.name);
                }
            }
            // also check unverified rule for a match
            if (config.verificationRules.unverified?.roles.some((role) => role.name === newRole.name)) {
                doesRoleNameMatch = true;
            }
        }

        if (!doesRoleNameMatch) return; // exit early if the newly created role does not relate to verification rules

        // prompt server admins if they want to automatically update verification rules to use the new role
        const embed = new EmbedBuilder()
            .setTitle('Newly Created Role Detected')
            .setColor('Blue')
            .setDescription(
                `The newly created role named ${inlineCode(newRole.name)} matches the name of a role set in verification rules. Would you like to automatically update the verification rules to assign the newly created role when the rule(s) match?`
            )
            .setTimestamp();

        const updateId = `roleCreate|updateButton|${uuidv4()}`;
        const ignoreId = `roleCreate|ignoreButton|${uuidv4()}`;
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(updateId).setLabel('Update Roles').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(ignoreId).setLabel('Ignore').setStyle(ButtonStyle.Danger)
        );

        const message = await Modlog.logMessage(guild, { embeds: [embed], components: [row] });
        if (!message) return; // we send this prompt to modlog; if modlog is not enabled, skip

        // only allow those with ManageGuild permissions to interact with this prompt
        const filter = (i: MessageComponentInteraction) =>
            i.inCachedGuild() && i.member && i.member.permissions.has(PermissionFlagsBits.ManageGuild);
        await message
            .awaitMessageComponent({ filter, time: 1000 * 60 * 30, componentType: ComponentType.Button })
            .then(async (i) => {
                await i.deferUpdate();

                if (i.customId === updateId) {
                    let didRulesUpdate = false;

                    // fetch a new config as up to 30 minutes could have passed since we last queried
                    const newConfig = await GuildConfigModel.findOne({ guildId: guild.id });

                    // check if the role name matches a role set in rules (regular and unverified)
                    for (const rule of newConfig?.verificationRules?.rules ?? []) {
                        for (const role of rule.roles) {
                            if (role.name === newRole.name) {
                                role.id = newRole.id;
                                didRulesUpdate = true;
                            }
                        }
                    }
                    for (const role of newConfig?.verificationRules?.unverified?.roles ?? []) {
                        if (role.name === newRole.name) {
                            role.id = newRole.id;
                            didRulesUpdate = true;
                        }
                    }

                    if (newConfig && didRulesUpdate) {
                        await newConfig.save();

                        const updatedEmbed = new EmbedBuilder()
                            .setTitle('Newly Created Role Detected')
                            .setColor('Green')
                            .setDescription(
                                `The newly created role named ${inlineCode(newRole.name)} was updated to be the role assigned in verification rules by ${i.member}.`
                            )
                            .setTimestamp();

                        await i.editReply({ embeds: [updatedEmbed], components: [] });
                        logger.info(
                            { event: { name: eventName }, role: { id: newRole.id, name: newRole.name }, guild: { id: guild.id } },
                            'Newly created role matching verification rules was automatically updated'
                        );
                    } else {
                        const updatedEmbed = new EmbedBuilder()
                            .setColor('Grey')
                            .setTitle('Newly Created Role Detected')
                            .setDescription(
                                `${i.member} chose to update verification rules to reflect the newly created role ${inlineCode(
                                    newRole.name
                                )}. However, rules may have changed in the meantime causing no changes to be made.`
                            );

                        await i.editReply({ embeds: [updatedEmbed], components: [] });
                        logger.info(
                            { event: { name: eventName }, role: { id: newRole.id, name: newRole.name }, guild: { id: guild.id } },
                            'Newly created role matching verification rules update selected but no matches found'
                        );
                    }
                } else if (i.customId === ignoreId) {
                    const updatedEmbed = new EmbedBuilder()
                        .setTitle('Newly Created Role Detected')
                        .setColor('Yellow')
                        .setDescription(
                            `${i.member} selected to not update the verification rules to assign the newly created role ${inlineCode(newRole.name)} when rules dictate that a role named ${inlineCode(newRole.name)} should be assigned. This could mean that your verification rule configuration will not behave as expected.`
                        )
                        .setTimestamp();

                    await i.editReply({ embeds: [updatedEmbed], components: [] });

                    logger.info(
                        { event: { name: eventName }, role: { id: newRole.id, name: newRole.name }, guild: { id: guild.id } },
                        'Newly created role matching verification rules was set to not automatically update'
                    );
                }
            })
            .catch(async (e) => {
                if (e.name === 'Error [InteractionCollectorError]') {
                    logger.info(
                        { event: { name: eventName }, role: { id: newRole.id, name: newRole.name }, guild: { id: guild.id } },
                        'Prompt to update newly created role matching verification rules was ignored'
                    );

                    const embed = new EmbedBuilder()
                        .setTitle('Newly Created Role Detected')
                        .setColor('Blue')
                        .setDescription(
                            `The newly created role named ${inlineCode(newRole.name)} matches the name of a role set in verification rules. No one responded to the prompt asking if verification rules should be automatically updated to reflect this new role, so the server's verification rule configuration may not behave as expected.`
                        )
                        .setTimestamp();

                    await message.edit({ embeds: [embed], components: [] });
                }
            });
    }
}
