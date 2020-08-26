const Discord = require('discord.js');
const settings = require('../settings.js');

module.exports = {
    name: 'help',
    description: 'List all commands or get specific info about a specific command',
    args: false,
    guildOnly: false,
    displayHelp: true,
    usage: "(command name)",
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
                    { name: 'Detailed Command Help', value: `For help about a specific command, use \`${prefix}help [command]\`\n Example usage: \`${prefix}help prefix\``}
                )
            return message.channel.send(helpEmbed);
        };

        const commandName = args.split(/\s/)[0].toLowerCase();
        const command = commands.get(commandName);

        if (!command) {
            return message.reply("that's not a valid command!");
        }

        const commandEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Command: \`${prefix}${command.name}\``)
            .addFields(
                { name: 'Description', value: command.description },
                { name: 'Usage', value: `\`${prefix}${command.name}${command.usage ? ` ${command.usage}` : ''}\``}
            )

        message.channel.send(commandEmbed);
    }
}