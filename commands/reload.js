const Discord = require('discord.js');

const settings = require('../settings.js');

module.exports = {
    name: 'reload',
    description: 'Bot owner only - reload bot settings',
    args: false,
    guildOnly: false,
    async execute(message, args) {
        if (message.author.id === process.env.ADMIN_ID) {
            await settings.loadSettings();
            message.channel.send('Settings have been successfully reloaded');
        }
    }
}