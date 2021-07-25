const Discord = require('discord.js');
const mongo = require('../mongo.js');
// const { assignRole } = require('../server/server');

const settings = require('../settings.js');

module.exports = {
    name: 'banalts',
    description: 'Bans all alts of a verified Discord user using their Waterloo ID.',
    args: true,
    guildOnly: true,
    displayHelp: true,
    permissions: ['MANAGE_GUILD'],
    async execute(message, args) {
        const userID = args
        const guildSettings = settings.get(message.guild?.id);
        if (!guildSettings.verificationEnabled) {
            return message.reply('This server does not have verification enabled');
        }

        message.channel.send(`Attempting to ban all alternate accounts of the user ${userID}`);
        await message.guild.members.fetch();

        // get specified user's UWID
        const { uwid: userUWID } = await mongo.getDB().collection("users").findOne({ discordId: userID.id })
        let altCounter = 0
        // find all other discord accounts that share this UWID
        for await (const user of mongo.getDB().collection("users").find({ uwid: userUWID })) {
          // probably not very efficient for large servers, could just try/catch
          // errors if user doesn't exist instead
          if (message.guild.members.cache.has(discordId)) {
            // ban user
            await message.guild.ban(user.discordId)
            altCounter++
          }
        }

        message.channel.send(`The user ${userID} had ${altCounter} alts that were successfully banned.`);
    }
}