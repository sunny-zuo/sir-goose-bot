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
    Role,
    Collection,
    Snowflake,
} from 'discord.js';
import { ModalSubmitInteractionHandler } from './modalInteractionHandler';
import { RoleData, VerificationImportV2, VerificationRule, UnverifiedConfig, VerificationRuleImportV2 } from '#types/Verification';
import { v4 as uuidv4 } from 'uuid';
import { GuildConfigCache } from '#util/guildConfigCache';
import { VerifyAll } from '#commands/chat/verification/verifyall';
import { Result } from '#types/index';

export class VerifyRulesModalSubmitInteractionHandler implements ModalSubmitInteractionHandler {
    readonly client: Client;
    readonly customId = 'verifyRulesModal';
    readonly userPermissions: bigint[] = [PermissionsBitField.Flags.ManageGuild, PermissionsBitField.Flags.ManageRoles];

    constructor(client: Client) {
        this.client = client;
    }

    async execute(interaction: ModalSubmitInteraction): Promise<void> {
        if (!interaction.inCachedGuild()) return;
        await interaction.deferReply(); // defer reply as other checks could take a while

        const ruleString = interaction.fields.getTextInputValue('ruleStringInput');
        let importedJSON: VerificationImportV2;

        const importErrorEmbed = new EmbedBuilder()
            .setTitle('Import Error')
            .setDescription(
                'You provided an invalid rule import. Please make sure you copy and pasted correctly from the [rule creation tool](https://sebot.sunnyzuo.com/).'
            )
            .setColor('Red');

        // start by attempting to parse the verification rule import
        try {
            importedJSON = JSON.parse(ruleString);
            if (importedJSON?.v !== 2) throw new Error('Rule import must be v2');
            if (!importedJSON.rules || importedJSON.rules.length === 0) throw new Error('No rules found');
        } catch (e) {
            await interaction.editReply({ embeds: [importErrorEmbed] });
            return;
        }

        // next, parse all of our verification rules
        const guildRoles = await interaction.guild.roles.fetch();

        const newRules: VerificationRule[] = [];
        for (const [idx, importedRule] of importedJSON.rules.entries()) {
            const parsed = this.parseRule(importedRule, guildRoles);
            if (parsed.success) {
                newRules.push(parsed.value);
            } else {
                const errorMessage = `Error parsing rule #${idx + 1}: ${parsed.error}`;
                await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription(errorMessage).setTitle('Import Error')],
                });
                return;
            }
        }

        // then, parse the unverified configuration if it exists
        let unverifiedConfig: UnverifiedConfig | undefined = undefined;
        if (Array.isArray(importedJSON.unverified?.roles) && importedJSON.unverified.roles.length > 0) {
            const parsedRoles = this.parseRoles(importedJSON.unverified.roles, guildRoles);
            if (parsedRoles.success) {
                unverifiedConfig = { roles: parsedRoles.value };
            } else {
                await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription(parsedRoles.error).setTitle('Import Error')],
                });
                return;
            }
        }

        // finally, update the config stored in the database
        const config = await GuildConfigCache.fetchOrCreate(interaction.guild!.id);
        const oldConfig = { ...config.toObject() }; // save a copy of the old config for role replacement

        config.verificationRules = {
            baseYear: -1, // TODO: remove base year from code
            rules: newRules,
            unverified: unverifiedConfig,
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

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        // inform the user about the successful rule update and ask if they want to transition roles to use the new rules
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

        const message = await interaction.editReply({ embeds: [embed], components: [buttons] });

        // function called when user skips role update or if no interaction is received after 15 minutes
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
                time: 1000 * 60 * 15,
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
                    await interaction.editReply({ embeds: [embed], components: [] });
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

    /**
     * Parse a rule that is imported. Returns the parsed rule if successful, or an a user readable error message if not
     * @param rule the raw, imported rule to parse
     */
    parseRule(importedRule: VerificationRuleImportV2, guildRoles: Collection<Snowflake, Role>): Result<VerificationRule, string> {
        const copyPasteNote =
            'Please ensure you are copy and pasting correctly from the [rule creation tool](https://sebot.sunnyzuo.com/).';

        if (!importedRule.roles || importedRule.roles.length === 0) {
            return { success: false, error: `No roles to be assigned are specified for this rule. ${copyPasteNote}` };
        } else if (!importedRule.department) {
            return { success: false, error: `The department to match with is missing from this rule. ${copyPasteNote}` };
        } else if (!importedRule.match || !['anything', 'exact', 'begins', 'contains'].includes(importedRule.match)) {
            return { success: false, error: `The specified department match type is invalid. ${copyPasteNote}` };
        } else if (!importedRule.yearMatch || !['all', 'equal', 'upper', 'lower'].includes(importedRule.yearMatch)) {
            return { success: false, error: `The specified year match type is invalid. ${copyPasteNote}` };
        }

        const roleParseResult = this.parseRoles(importedRule.roles, guildRoles);
        if (!roleParseResult.success) return roleParseResult;

        const parsedRule: VerificationRule = {
            roles: roleParseResult.value,
            department: String(importedRule.department),
            matchType: String(importedRule.match),
            yearMatch: String(importedRule.yearMatch),
        };

        if (importedRule.yearMatch !== 'all') {
            const numYear = Number(importedRule.year);
            if (isNaN(numYear)) {
                return {
                    success: false,
                    error: `The specified year to match is not a valid number. ${copyPasteNote}`,
                };
            } else if (!Number.isInteger(numYear)) {
                return {
                    success: false,
                    error: `The specified year to match is not an integer. ${copyPasteNote}`,
                };
            } else {
                parsedRule.year = numYear;
            }
        }

        return { success: true, value: parsedRule };
    }

    parseRoles(rawRoleNames: string[], guildRoles: Collection<Snowflake, Role>): Result<RoleData[], string> {
        const roleNames = new Set(rawRoleNames.map(name => name.trim()));
        if (roleNames.size !== rawRoleNames.length) {
            return {
                success: false,
                error: `The same role name appears multiple times in the roles to be assigned from this rule.`,
            };
        }

        const parsedRoles: RoleData[] = [];
        for (const roleName of roleNames) {
            const role = guildRoles.find((role) => role.name === roleName);

            if (!role) {
                return {
                    success: false,
                    error: `The role "${roleName}" could not be found on this server. Please confirm the role exists, and then try again.`,
                };
            } else if (!role.editable) {
                return {
                    success: false,
                    error: `I do not have permission to assign the "${roleName}" role. Make sure I have the ${inlineCode(
                        'Manage Roles'
                    )} permission and that my role is placed above all roles that you want to assign.`,
                };
            } else {
                parsedRoles.push({ id: role.id, name: role.name });
            }
        }

        return { success: true, value: parsedRoles };
    }
}
