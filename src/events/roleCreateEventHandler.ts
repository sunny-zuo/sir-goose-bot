import { EventHandler } from './eventHandler';
import Client from '../Client';
import { GuildMember, MessageActionRow, MessageButton, MessageComponentInteraction, MessageEmbed, Role } from 'discord.js';
import { Modlog } from '../helpers/modlog';
import { GuildConfigCache } from '../helpers/guildConfigCache';
import { v4 as uuidv4 } from 'uuid';
import GuildConfigModel from '../models/guildConfig.model';

export class RoleCreateEventHandler implements EventHandler {
    readonly eventName = 'roleCreate';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(newRole: Role): Promise<void> {
        this.checkVerificationRules(newRole);
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
                        this.client.log.info(
                            `Newly created role ${newRole.name} matching verification rules was automatically updated by ${i.user.tag} in ${guild.name} (${guild.id}).`
                        );
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
                    this.client.log.info(
                        `Newly created role ${newRole.name} matching verification rules was set to not automatically update by ${i.user.tag} in ${guild.name} (${guild.id}).`
                    );
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

                    this.client.log.info(
                        `Prompt to update newly created role ${newRole.name} matching verification rules was ignored in ${guild.name} (${guild.id}).`
                    );
                }
            });
        }
    }
}
