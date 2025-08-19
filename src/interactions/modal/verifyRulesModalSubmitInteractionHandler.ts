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
import { VerificationImportV2, VerificationRule, UnverifiedConfig } from '#types/Verification';
import { v4 as uuidv4 } from 'uuid';
import { GuildConfigCache } from '#util/guildConfigCache';
import { VerifyAll } from '#commands/chat/verification/verifyall';
import { parseRule } from '#util/verification';
import { parseRoles } from '#util/verificationRoles';
import { AdminConfigCache } from '#util/adminConfigCache';

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
            const parsed = parseRule(importedRule, guildRoles);
            if (parsed.success) {
                newRules.push(parsed.value);
            } else {
                const errorMessage = `**Error parsing rule #${idx + 1}**: ${parsed.error}`;
                await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription(errorMessage).setTitle('Verification Rule Import Error')],
                });
                return;
            }
        }

        // then, parse the unverified configuration if it exists
        // temporarily control access under ENABLE_UNVERIFIED_RULE flag
        const isAvailable = (await AdminConfigCache.getConfig(AdminConfigCache.FLAGS.ENABLE_UNVERIFIED_RULES, 'false')) === 'true';
        let unverifiedConfig: UnverifiedConfig | undefined = undefined;
        if (isAvailable && Array.isArray(importedJSON.unverified?.roles) && importedJSON.unverified.roles.length > 0) {
            const parsedRoles = parseRoles(importedJSON.unverified.roles, guildRoles);
            if (parsedRoles.success) {
                unverifiedConfig = { roles: parsedRoles.value };
            } else {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder().setColor('Red').setDescription(parsedRoles.error).setTitle('Verification Rule Import Error'),
                    ],
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
}
