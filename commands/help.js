const Discord = require('discord.js');
const settings = require('../settings.js');

module.exports = {
    name: 'help',
    description: 'List all commands or get specific info about a specific command',
    args: false,
    guildOnly: false,
    displayHelp: true,
    execute(message, args) {
        const prefix = settings.get(message.guild?.id).prefix;
        const { commands } = message.client;

        if (!args?.length) {
            const commandList = commands.filter(command => command.displayHelp).map(command => `\`${command.name}\``).join(", ");
            const helpEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Command Help')
                .addFields(
                    { name: 'Prefix', value: `The prefix for ${message.guild?.name ? `${message.guild.name} ` : ` the bot by default `} is \`${prefix}\``},
                    { name: 'Command List', value: commandList },
                    { name: 'Detailed Command Help', value: `For help about a specific command, use ${prefix}help [COMMAND]\n Example usage: \`${prefix}help prefix\``}
                )
            message.channel.send(helpEmbed);
        }
    }
}