import { EventHandler } from './eventHandler';
import Client from '../Client';
import { GuildMember, MessageActionRow, MessageButton, MessageComponentInteraction, MessageEmbed, Role } from 'discord.js';
import { Modlog } from '../helpers/modlog';
import GuildConfigModel from '../models/guildConfig.model';
import ButtonRoleModel from '../models/buttonRole.model';
import { GuildConfigCache } from '../helpers/guildConfigCache';
import { v4 as uuidv4 } from 'uuid';
import { chunk } from '../helpers/array';

export class RoleUpdateEventHandler implements EventHandler {
    readonly eventName = 'roleUpdate';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(oldRole: Role, newRole: Role): Promise<void> {
        this.updateVerificationRules(oldRole, newRole);
        this.promptUpdateVerificationRules(oldRole, newRole);
        this.updateButtonRolePrompts(oldRole, newRole);
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
                await config.save();
                Modlog.logInfoMessage(
                    this.client,
                    guild,
                    'Verification Role Updated',
                    `The role \`${oldRole.name}\` is used for verification, and was renamed to \`${newRole.name}\`. The server's verification rules have automatically updated to reflect this change.`,
                    'GREEN'
                );
            }
        }
    }

    async promptUpdateVerificationRules(oldRole: Role, newRole: Role): Promise<void> {
        // this check is in place so that this function will only be called for pseudo role creation events
        if (oldRole.name !== 'new role' || newRole.name === 'new role') return;

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
            const embed = new MessageEmbed()
                .setTitle('New Role Created')
                .setColor('BLUE')
                .setDescription(
                    `The newly created role named \`${newRole.name}\` matches the name of a role set in verification rules. Would you like to automatically update the verification rules to assign the newly created role when the rule(s) match?`
                )
                .setTimestamp();

            const updateId = uuidv4();
            const ignoreId = uuidv4();
            const row = new MessageActionRow().addComponents(
                new MessageButton().setCustomId(updateId).setLabel('Update Roles').setStyle('SUCCESS'),
                new MessageButton().setCustomId(ignoreId).setLabel('Ignore').setStyle('DANGER')
            );

            const message = await Modlog.logMessage(this.client, guild, { embeds: [embed], components: [row] });
            if (!message) return;

            const filter = (i: MessageComponentInteraction) => i.member !== undefined;
            const collector = message.createMessageComponentCollector({ filter, componentType: 'BUTTON', time: 1000 * 60 * 5 });
            let validInteractionReceived = false;

            collector.on('collect', async (i) => {
                const member = i.member as GuildMember;

                if (!member.permissions.has('MANAGE_GUILD')) {
                    const embed = new MessageEmbed()
                        .setColor('RED')
                        .setDescription('You must have the `Manage Server` permission to interact with this button.');

                    return i.reply({ embeds: [embed] });
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

                        const updatedEmbed = new MessageEmbed()
                            .setTitle('New Role Created')
                            .setColor('GREEN')
                            .setDescription(
                                `The newly created role named \`${newRole.name}\` was updated to be the role assigned in verification rules by ${i.member}.`
                            )
                            .setTimestamp();

                        await i.update({ embeds: [updatedEmbed], components: [] });
                        validInteractionReceived = true;
                        collector.stop();
                    }
                } else if (i.customId === ignoreId) {
                    const updatedEmbed = new MessageEmbed()
                        .setTitle('New Role Created')
                        .setColor('YELLOW')
                        .setDescription(
                            `${i.member} selected to not update the verification rules to assign the newly created role \`${newRole.name}\` when rules dictate that a role named \`${newRole.name}\` should be assigned.`
                        )
                        .setTimestamp();

                    await i.update({ embeds: [updatedEmbed], components: [] });
                    validInteractionReceived = true;
                    collector.stop();
                }
            });

            collector.on('end', async () => {
                if (!validInteractionReceived) {
                    const embed = new MessageEmbed()
                        .setTitle('New Role Created')
                        .setColor('BLUE')
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

        const prompts = await ButtonRoleModel.find({ guildId: guild.id, 'roles.name': oldRole.name });
        if (!prompts || !prompts.length) return;

        for (const prompt of prompts) {
            prompt.roles.find((r) => r.name === oldRole.name)!.name = newRole.name;
            await prompt.save();

            const promptChannel = await guild.channels.fetch(prompt.channelId);
            if (!promptChannel || !promptChannel.isText()) {
                await prompt.delete();
                continue;
            }

            const promptMessage = await promptChannel.messages.fetch(prompt.messageId).catch(async () => {
                await prompt.delete();
            });
            if (!promptMessage) continue;

            const components: MessageActionRow[] = [];
            for (const roleChunk of chunk(prompt.roles, 5)) {
                const row = new MessageActionRow();
                for (const role of roleChunk) {
                    row.addComponents(
                        new MessageButton()
                            .setCustomId(`buttonRole|{"roleId":"${role.id}","_id":"${prompt._id}"}`)
                            .setLabel(role.name)
                            .setStyle('PRIMARY')
                    );
                }
                components.push(row);
            }

            await promptMessage.edit({ components });
        }
    }
}
