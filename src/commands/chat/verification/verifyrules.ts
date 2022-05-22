import {
    Message,
    CommandInteraction,
    Permissions,
    ApplicationCommandOption,
    MessageEmbed,
    CommandInteractionOptionResolver,
} from 'discord.js';
import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import { GuildConfigCache } from '#util/guildConfigCache';
import { VerificationRule, RoleData, VerificationImportV2 } from '#types/Verification';
import { serializeVerificationRules } from '#util/verification';
import { codeBlock, inlineCode } from '@discordjs/builders';

export class VerifyRules extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'rules',
            description: 'The new verification rules to set',
            type: 'STRING',
        },
    ];
    constructor(client: Client) {
        super(client, {
            name: 'verifyrules',
            description: 'Set or see verification rules. Create a ruleset here: https://sebot.sunnyzuo.com/',
            category: 'Verification',
            options: VerifyRules.options,
            guildOnly: true,
            clientPermissions: [Permissions.FLAGS.MANAGE_ROLES],
            userPermissions: [Permissions.FLAGS.MANAGE_GUILD],
        });
    }

    async execute(
        interaction: Message | CommandInteraction,
        args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const ruleString = args?.getString('rules');

        if (ruleString) {
            let importedJSON: VerificationImportV2;

            try {
                importedJSON = JSON.parse(ruleString);

                if (importedJSON?.v !== 2) throw new Error('Rule import was not v2');
            } catch (e) {
                await this.sendErrorEmbed(
                    interaction,
                    'Import Error',
                    'You provided an invalid rule import. Please make sure you copy and pasted correctly from the [rule creation tool.](https://sebot.sunnyzuo.com/).'
                );
                return;
            }

            if (!importedJSON.rules || importedJSON.rules.length === 0) {
                await this.sendErrorEmbed(
                    interaction,
                    'Import Error',
                    'You provided an invalid or empty rule import. Please make sure you copy and pasted correctly from the [rule creation tool.](https://sebot.sunnyzuo.com/).'
                );
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
                    const roles: RoleData[] = [];

                    for (const roleName of importedRule.roles) {
                        const role = interaction.guild?.roles.cache.find((role) => role.name === roleName);

                        if (!role) {
                            await this.sendErrorEmbed(
                                interaction,
                                'Invalid Role',
                                `The role "${roleName}" could not be found on this server.`
                            );
                            return;
                        } else if (!role.editable) {
                            await this.sendErrorEmbed(
                                interaction,
                                'Unable to Assign Role',
                                `I do not have permission to assign the "${roleName}" role. Make sure I have the \`Manage Roles\` permission and that my role is placed above all roles that you want to assign.`
                            );
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

            const embed = new MessageEmbed().setColor('GREEN').setTitle('Verification Rules Updated Successfully')
                .setDescription(`Verification is ${
                config.enableVerification ? 'enabled' : `disabled. Enable it using ${inlineCode('/config')}`
            }. [Create a ruleset.](https://sebot.sunnyzuo.com/)
                ${codeBlock(serializeVerificationRules(config.verificationRules))}`);

            await interaction.reply({ embeds: [embed] });
        } else {
            const config = await GuildConfigCache.fetchConfig(interaction.guild!.id);

            const embed = new MessageEmbed().setColor('GREEN').setTitle('Verification Rules').setDescription(`Verification is ${
                config.enableVerification ? 'enabled' : `disabled. Enable it using ${inlineCode('/config')}`
            }. [Create a ruleset.](https://sebot.sunnyzuo.com/)
                ${codeBlock(serializeVerificationRules(config.verificationRules))}`);

            await interaction.reply({ embeds: [embed] });
        }
    }
}
