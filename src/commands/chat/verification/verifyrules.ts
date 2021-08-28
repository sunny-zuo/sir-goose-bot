import {
    Message,
    CommandInteraction,
    Permissions,
    ApplicationCommandOption,
    MessageEmbed,
    CommandInteractionOptionResolver,
} from 'discord.js';
import { ChatCommand } from '../ChatCommand';
import Client from '../../../Client';
import { GuildConfigCache } from '../../../helpers/guildConfigCache';
import { VerificationRule, RoleData, VerificationRules } from '../../../types/Verification';

interface VerificationRuleImport {
    roles: string[];
    department: string;
    match: string;
    year: string;
}

interface VerificationImport {
    baseYear: number;
    rules: VerificationRuleImport[];
}

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

    async execute(interaction: Message | CommandInteraction, args?: CommandInteractionOptionResolver): Promise<void> {
        const ruleString = args?.getString('rules');

        if (ruleString) {
            let importedJSON: VerificationImport;

            try {
                importedJSON = JSON.parse(ruleString);
            } catch (e) {
                this.sendErrorEmbed(
                    interaction,
                    'Import Error',
                    'You provided an invalid rule import. Please make sure you copy and pasted correctly from the [rule creation tool.](https://sebot.sunnyzuo.com/).'
                );
                return;
            }

            if (!importedJSON.rules || importedJSON.rules.length === 0 || isNaN(importedJSON.baseYear)) {
                this.sendErrorEmbed(
                    interaction,
                    'Import Error',
                    'You provided an invalid or empty rule import. Please make sure you copy and pasted correctly from the [rule creation tool.](https://sebot.sunnyzuo.com/).'
                );
                return;
            }

            const newRules = [];

            await interaction.guild?.roles.fetch();

            for (const importedRule of importedJSON.rules) {
                if (importedRule.roles?.length > 0 && importedRule.department && importedRule.match && importedRule.year) {
                    const roles: RoleData[] = [];

                    for (const roleName of importedRule.roles) {
                        const role = await interaction.guild?.roles.cache.find((role) => role.name === roleName);

                        if (!role) {
                            this.sendErrorEmbed(interaction, 'Invalid Role', `The role "${roleName}" could not be found on this server.`);
                            return;
                        } else if (!role.editable) {
                            this.sendErrorEmbed(
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
                        yearMatch: String(importedRule.year),
                    };

                    newRules.push(newRule);
                }
            }

            const config = await GuildConfigCache.fetchOrCreate(interaction.guild!.id);

            config.verificationRules = {
                baseYear: Number(importedJSON.baseYear),
                rules: newRules,
            };

            await config.save();

            const embed = new MessageEmbed().setColor('GREEN').setTitle('Verification Rules Updated Successfully')
                .setDescription(`Verification is ${
                config.enableVerification ? 'enabled' : `disabled. Enable it using \`${config.prefix}config enable_verification true\``
            }. [Create a ruleset.](https://sebot.sunnyzuo.com/)
                \`\`\`${this.serializeVerificationRules(config.verificationRules)}\`\`\``);

            interaction.reply({ embeds: [embed] });
        } else {
            const config = await GuildConfigCache.fetchConfig(interaction.guild!.id);

            const embed = new MessageEmbed().setColor('GREEN').setTitle('Verification Rules').setDescription(`Verification is ${
                config.enableVerification ? 'enabled' : `disabled. Enable it using \`${config.prefix}config enable_verification true\``
            }. [Create a ruleset.](https://sebot.sunnyzuo.com/)
                \`\`\`${this.serializeVerificationRules(config.verificationRules)}\`\`\``);

            interaction.reply({ embeds: [embed] });
        }
    }

    private serializeVerificationRules(verificationRules: VerificationRules | undefined): string {
        if (!verificationRules) {
            return '';
        }

        const serializedRules: VerificationRuleImport[] = [];

        for (const rule of verificationRules.rules) {
            const serializedRule: VerificationRuleImport = {
                roles: rule.roles.map((role) => role.name),
                department: rule.department,
                match: rule.matchType,
                year: rule.yearMatch,
            };

            serializedRules.push(serializedRule);
        }

        return JSON.stringify({ baseYear: verificationRules.baseYear, rules: serializedRules });
    }
}
