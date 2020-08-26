const settings = require('../settings.js');

module.exports = {
    name: 'prefix',
    description: 'Set the server\'s bot prefix',
    args: true,
    guildOnly: true,
    displayHelp: true,
    usage: '[prefix]',
    permissions: ['MANAGE_GUILD'],
    execute(message, args) {
        const prefix = args;

        if (prefix.length > 6) {
            return message.channel.send('The prefix must be shorter than 7 characters.')
        }

        let serverSetting = { ...settings.get(message.guild.id) };
        serverSetting.prefix = args;
        settings.set(message.guild.id, serverSetting);
        message.channel.send(`The bot\'s prefix has been updated to ${args}`);
    }
}