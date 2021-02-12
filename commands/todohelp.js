const Discord = require('discord.js');

const settings = require('../settings.js');

module.exports = {
    name: 'todohelp',
    description: 'Get help for todo list functionality',
    args: false,
    guildOnly: false,
    displayHelp: true,
    execute(message, args) {
        const guildSettings = settings.get(message.guild?.id);
        const verifyHelpEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Todo Help')
            .addFields(
                { 
                    name: `${guildSettings.prefix}upcoming [view type] [class]`, 
                    value: `View a list of tasks in the next number of days.
                        Example usages:
                        \`${guildSettings.prefix}upcoming\` - View incomplete tasks
                        \`${guildSettings.prefix}upcoming all \` - View all tasks
                        \`${guildSettings.prefix}upcoming cs138\` - View all tasks from the CS 138 class` 
                },
                { 
                    name: `${guildSettings.prefix}complete (id)`, 
                    value: `Mark a task(s) as complete by ID
                        Example usages: 
                        \`${guildSettings.prefix}complete 23\` - Marks task #23 as complete
                        \`${guildSettings.prefix}complete 10 43 84\` - Marks tasks #10, 43 and 84 as complete` 
                },
                {
                    name: `${guildSettings.prefix}incomplete (id)`,
                    value: `Mark a task(s) as incomplete by ID
                        Example usages: 
                        \`${guildSettings.prefix}incomplete 23\` - Marks task #23 as incomplete
                        \`${guildSettings.prefix}incomplete 10 43 84\` - Marks tasks #10, 43 and 84 as incomplete`
                },)
            .setFooter('https://github.com/sunny-zuo/sir-goose-bot');
        message.channel.send(verifyHelpEmbed);
    }
}