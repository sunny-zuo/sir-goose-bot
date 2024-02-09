import Client from '#src/Client';
import { GuildMember, EmbedBuilder, ModalSubmitInteraction, codeBlock, inlineCode, PermissionsBitField } from 'discord.js';
import { ModalSubmitInteractionHandler } from './modalInteractionHandler';
import { RoleData, VerificationImportV2, VerificationRule } from '#types/Verification';
import { serializeVerificationRules } from '#util/verification';
import { GuildConfigCache } from '#util/guildConfigCache';

export class VerifyRulesModal implements ModalSubmitInteractionHandler {
    readonly client: Client;
    readonly customId = 'verifyRulesModal';

    constructor(client: Client) {
        this.client = client;
    }

    async execute(interaction: ModalSubmitInteraction): Promise<void> {
        // TODO: refactor into more generic permission checker
        const member = interaction.member as GuildMember;
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

        config.verificationRules = {
            baseYear: -1, // TODO: remove base year from code
            rules: newRules,
        };

        await config.save();

        const embed = new EmbedBuilder().setColor('Green').setTitle('Verification Rules Updated Successfully')
            .setDescription(`Verification is ${
            config.enableVerification ? 'enabled' : `disabled. Enable it using ${inlineCode('/config')}`
        }. [Create a ruleset.](https://sebot.sunnyzuo.com/)
                ${codeBlock(serializeVerificationRules(config.verificationRules))}`);

        await interaction.reply({ embeds: [embed] });
    }
}
