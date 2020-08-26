const settings = require('../settings.js');

module.exports = {
    name: 'reload',
    description: 'Bot owner only - reload bot settings',
    args: false,
    guildOnly: false,
    ownerOnly: true,
    displayHelp: false,
    async execute(message, args) {
        await settings.loadSettings();
        message.channel.send('Settings have been successfully reloaded');
    }
}