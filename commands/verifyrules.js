const settings = require('../settings.js');
const Discord = require('discord.js');

module.exports = {
    name: 'verifyrules',
    description: 'Set or see verification rules. [Create a ruleset.](https://sebot.sunnyzuo.com/)',
    args: false,
    usage: '[ruleset]',
    permissions: ['MANAGE_GUILD'],
    guildOnly: true,
    displayHelp: true,
    async execute(message, args) {
        if (args) {
            try {
                JSON.parse(args);
            } catch (e) {
                return message.reply('you provided an invalid rule import. Please make sure you copy and pasted correctly.');
            }
            const importedJSON = JSON.parse(args);
            if (!importedJSON.rules) {
                return message.reply('you provided an invalid or empty rule import. Please make sure you copy and pasted correctly.');
            }
            const newRules = [];
            for (const importedRule of importedJSON.rules) {
                if (importedRule.roles?.length > 0 && importedRule.department && importedRule.match && importedRule.year) {
                    const newRule = {};
                    newRule.roles = importedRule.roles;
                    newRule.department = String(importedRule.department);
                    newRule.match = String(importedRule.match);
                    newRule.year = String(importedRule.year);
                    newRules.push(newRule);
                }
            }

            if (isNaN(importedJSON.baseYear) || newRules.length === 0) {
                return message.reply('you provided an invalid rule import. Please make sure you copy and pasted correctly.');
            }

            const serverSettings = settings.get(message.guild.id);
            serverSettings.verificationRules = {
                baseYear: Number(importedJSON.baseYear),
                rules: newRules
            };

            settings.set(message.guild.id, serverSettings);
            message.channel.send(new Discord.MessageEmbed().setColor("#00ff00")
                .setTitle('Verification Rules Updated Successfully')
                .setDescription(`Verification is ${serverSettings.verificationEnabled ? 'enabled' : 'disabled'}. [Create a ruleset.](https://sebot.sunnyzuo.com/)
                \`\`\`${JSON.stringify(serverSettings.verificationRules)}\`\`\``));
        } else {
            const serverSettings = settings.get(message.guild.id);
            message.channel.send(new Discord.MessageEmbed().setColor("0099ff")
                .setTitle('Verification Rules')
                .setDescription(`Verification is ${serverSettings.verificationEnabled ? 'enabled' : `disabled. Enable it in ${serverSettings.prefix}config`}. [Create a ruleset.](https://sebot.sunnyzuo.com/)
                \`\`\`${JSON.stringify(serverSettings.verificationRules)}\`\`\``));
        }
    }
}