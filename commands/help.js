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
            const allCommands = commands.filter(command => command.displayHelp).map(command => command.name);

            const verificationCommands = ['verify'];
            const adminCommands = ['config', 'verifyrules', 'prefix', 'verifyall', 'invite'];
            const todoCommands = ['todohelp', 'upcoming', 'complete', 'incomplete', 'settings'];
            const remainingCommands = allCommands.filter(command => !verificationCommands.concat(adminCommands, todoCommands).includes(command))

            const helpEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Command Help')
                .addFields(
                    { name: 'Prefix', value: `The prefix for ${message.guild?.name ? `${message.guild.name} ` : ` the bot by default `} is \`${prefix}\``},
                    { name: 'Verification Commands', value: verificationCommands.map(command => `\`${command}\``).join(", ") },
                    { name: 'Server Management Commands', value: adminCommands.map(command => `\`${command}\``).join(", ") },
                    { name: 'Todo List Commands', value: todoCommands.map(command => `\`${command}\``).join(", ") },
                    { name: 'Other Commands', value: remainingCommands.map(command => `\`${command}\``).join(", ") },
                    { name: 'Detailed Command Help', value: `For help about a specific command, use \`${prefix}help [command]\`\n Example usage: \`${prefix}help prefix\``}
                )
            return message.channel.send(helpEmbed);
        };

        const commandName = args.split(/\s/)[0].toLowerCase();
        const command = commands.get(commandName) || commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

        if (!command) {
            message.channel.send(new Discord.MessageEmbed().setColor("#9932cc")
                .setTitle('Error: Invalid Command')
                .setDescription(`No command with the name '${commandName}' was found.`))
            return;
        }

        const commandEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Command: \`${prefix}${command.name}\``);

        if (command.aliases) { commandEmbed.setDescription(`Aliases: *${prefix}${command.aliases.join(`, ${prefix}`)}*`)};

        commandEmbed.addFields(
                { name: 'Description', value: command.description },
                { name: 'Usage', value: `\`${prefix}${command.name}${command.usage ? ` ${command.usage}` : ''}\``}
            )

        message.channel.send(commandEmbed);
    }
}