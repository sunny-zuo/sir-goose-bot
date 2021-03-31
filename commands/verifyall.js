const Discord = require('discord.js');
const mongo = require('../mongo.js');
const { assignRole } = require('../server/server');

const settings = require('../settings.js');

module.exports = {
    name: 'verifyall',
    description: 'Verify all existing users',
    args: false,
    guildOnly: true,
    displayHelp: false,
    permissions: ['MANAGE_GUILD'],
    async execute(message, args) {
        const guildSettings = settings.get(message.guild?.id);
        if (!guildSettings.verificationEnabled) {
            return message.reply('This server does not have verification enabled');
        }

        message.channel.send('Attempting to verify all users that can be auto-verified.');
        await message.guild.members.fetch();
        
        for (user of message.guild.members.cache.values()) {
            const userData = await mongo.getDB().collection("users").findOne({ discordId: user.id });
            if (userData) {
                await assignRole(message.guild, guildSettings, user, userData);
            }
        }
        message.channel.send('All users that could be auto-verified were verified!');
    }
}