import Client from '#src/Client';
import {
    EmbedBuilder,
    ModalSubmitInteraction,
    inlineCode,
    PermissionsBitField,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ComponentType,
} from 'discord.js';
import { ModalSubmitInteractionHandler } from './modalInteractionHandler';
import { RoleData, VerificationImportV2, VerificationRule } from '#types/Verification';
import { v4 as uuidv4 } from 'uuid';
import { GuildConfigCache } from '#util/guildConfigCache';
import { VerifyAll } from '#commands/chat/verification/verifyall';

export class VerifyRulesModalSubmitInteractionHandler implements ModalSubmitInteractionHandler {
    readonly client: Client;
    readonly customId = 'verifyRulesModal';

    constructor(client: Client) {
        this.client = client;
    }

    async execute(interaction: ModalSubmitInteraction): Promise<void> {
        if (!interaction.inCachedGuild()) return;
        // TODO: refactor into more generic permission checker
        const member = interaction.member;
        if (!member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            await interaction.reply({
                embeds: [new EmbedBuilder().setDescription('You must have the Manage Guild permission to use this modal.').setColor('Red')],
                ephemeral: true,
            });
            return;
        }

        const ruleString = interaction.fields.getTextInputValue('ruleStringInput');

        let importedJSON: VerificationImportV2;

        const importErrorEmbed = new EmbedBuilder()
            .setTitle('Import Error')
            .setDescription(
                'You provided an invalid rule import. Please make sure you copy and pasted correctly from the [rule creation tool.](https://sebot.sunnyzuo.com/).'
            )
            .setColor('Red');

        try {
            importedJSON = JSON.parse(ruleString);

            if (importedJSON?.v !== 2) throw new Error('Rule import was not v2');
        } catch (e) {
            await interaction.reply({ embeds: [importErrorEmbed], ephemeral: true });
            return;
        }

        if (!importedJSON.rules || importedJSON.rules.length === 0) {
            await interaction.reply({ embeds: [importErrorEmbed], ephemeral: true });
            return;
        }

        const newRules = [];

        await interaction.guild?.roles.fetch();

        for (const importedRule of importedJSON.rules) {
            if (
                importedRule.roles?.length > 0 &&
                importedRule.department &&
                importedRule.match &&
                importedRule.yearMatch &&
                (!isNaN(Number(importedRule.year)) || importedRule.yearMatch === 'all')
            ) {
                if (
                    !['all', 'equal', 'upper', 'lower'].includes(importedRule.yearMatch) ||
                    !['anything', 'exact', 'begins', 'contains'].includes(importedRule.match)
                ) {
                    await interaction.reply({ embeds: [importErrorEmbed], ephemeral: true });
                    return;
                }

                const roles: RoleData[] = [];

                for (const roleName of importedRule.roles) {
                    const role = interaction.guild?.roles.cache.find((role) => role.name === roleName);

                    if (!role) {
                        const errorEmbed = new EmbedBuilder()
                            .setTitle('Invalid Role')
                            .setDescription(`The role "${roleName}" could not be found on this server.`)
                            .setColor('Red');

                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                        return;
                    } else if (!role.editable) {
                        const errorEmbed = new EmbedBuilder()
                            .setTitle('Unable to Assign Role')
                            .setDescription(
                                `I do not have permission to assign the "${roleName}" role. Make sure I have the \`Manage Roles\` permission and that my role is placed above all roles that you want to assign.`
                            )
                            .setColor('Red');

                        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
                        return;
                    } else {
                        roles.push({ id: role.id, name: role.name });
                    }
                }
                const newRule: VerificationRule = {
                    roles: roles,
                    department: String(importedRule.department),
                    matchType: String(importedRule.match),
                    yearMatch: String(importedRule.yearMatch),
                };

                if (importedRule.year) newRule.year = Number(importedRule.year);

                newRules.push(newRule);
            }
        }

        const config = await GuildConfigCache.fetchOrCreate(interaction.guild!.id);
        const oldConfig = { ...config.toObject() }; // save a copy of the old config for role replacement

        config.verificationRules = {
            baseYear: -1, // TODO: remove base year from code
            rules: newRules,
        };

        await config.save();

        if (!config.enableVerification) {
            const embed = new EmbedBuilder()
                .setColor('Green')
                .setDescription(
                    `Verification rules have been successfully updated! However, verification on this server is disabled. Enable it using ${inlineCode(
                        '/config'
                    )} for verification to work.`
                );

            await interaction.reply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder().setColor('Green').setDescription(
                `Verification rules have been successfully updated! By default, rule changes will only apply to new users: existing users' roles will not be modified.

                To update existing users, click the button below. Roles assigned from the old rules (if applicable) will be removed and new roles will be assigned.`
            );

            const updateId = `verifyRulesModalSubmit|updateButton|${uuidv4()}`;
            const ignoreId = `verifyRulesModalSubmit|ignoreButton|${uuidv4()}`;

            const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId(updateId).setLabel("Update Existing Users' Roles").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(ignoreId).setLabel('Skip').setStyle(ButtonStyle.Secondary)
            );

            const message = await interaction.reply({ embeds: [embed], components: [buttons], fetchReply: true });

            // function called when user skips role update or if no interaction is received after 30 minutes
            const skipRoleUpdate = async () => {
                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setDescription(
                        "Verification rules have been successfully updated! By default, rule changes will only apply to new users: existing users' roles were not modified."
                    );

                return message.edit({ embeds: [embed], components: [] });
            };

            await message
                .awaitMessageComponent({
                    componentType: ComponentType.Button,
                    time: 1000 * 60 * 30,
                    filter: (i) => i.user.id === interaction.user.id,
                })
                .then(async (i) => {
                    if (i.customId === updateId) {
                        await i.deferReply({ fetchReply: true });

                        const embed = new EmbedBuilder()
                            .setColor('Green')
                            .setDescription(
                                "Verification rules have been successfully updated! Existing users' roles will be updated to reflect the new changes."
                            );
                        await message.edit({ embeds: [embed], components: [] });
                        await VerifyAll.assignRolesWithProgressBar(i, oldConfig);
                    } else if (i.customId === ignoreId) {
                        await skipRoleUpdate();
                    }
                })
                .catch(async (e) => {
                    if (e.name === 'Error [InteractionCollectorError]') {
                        await skipRoleUpdate();
                    } else {
                        throw e;
                    }
                });
        }
    }
}
