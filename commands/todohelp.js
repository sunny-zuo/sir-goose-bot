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
                { name: `${guildSettings.prefix}upcoming [days = 7] [viewType = incomplete]`, 
                    value: `View a list of tasks in the next number of days.
                        Example usages:
                        \`${guildSettings.prefix}upcoming\` - View incomplete tasks due in the next 7 days
                        \`${guildSettings.prefix}upcoming 4\` - View incomplete tasks due in the next 4 days
                        \`${guildSettings.prefix}upcoming 5 all\` - View all tasks due in the next 5 days
                        \`${guildSettings.prefix}upcoming 6 complete\` - View complete tasks in the next 6 days` },
                { name: `${guildSettings.prefix}complete (id)`, value: `Mark a task as complete by ID\nExample usage: \`${guildSettings.prefix}complete #23\`` },
                { name: `${guildSettings.prefix}incomplete (id)`, value: `Mark a task as incomplete by ID\nExample usage: \`${guildSettings.prefix}incomplete #23\`` })
            .setFooter('https://github.com/sunny-zuo/sir-goose-bot');
        message.channel.send(verifyHelpEmbed);
    }
}