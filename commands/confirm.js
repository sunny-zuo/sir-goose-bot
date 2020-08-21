const mongo = require('../mongo');
const fetch = require('node-fetch');

const settings = require('../settings');

module.exports = {
    name: 'confirm',
    description: 'Confirm your UW identity using the code given',
    args: true,
    guildOnly: true,
    async execute(message, args) {
        const guildSettings = settings.get(message.guild?.id);
        if (!guildSettings.verificationEnabled) {
            return message.reply('This server does not have verification enabled');
        }

        const user = await mongo.getDB().collection("users").findOne({ discordID: message.author.id });
        
        if (!user) {
            return message.reply(`You need to ${guildSettings.prefix}verify first before you can confirm!`)
        }

        if (user.verified) {
            return message.reply(`You're already verified!`);
        }

        if (parseInt(args) === user.token) {
            // await mongo.getDB().collection("users").updateOne( { discordID: message.author.id }, { $set : { verified: true }});
            if (user.program === guildSettings.verificationProgram) {
                const verifiedRole = message.guild.roles.cache.find(role => role.name === guildSettings.verifiedRole);
                if (!verifiedRole) return message.channel.send(`The verified role does not exist, or is not configured with the bot. Please contact a server Admin to fix.`);

                message.member.roles.add(verifiedRole, "Verified UW ID through bot");
                return message.channel.send(`Thanks for verifying, ${message.author}. Welcome to the server!`)
            } else {
                if (guildSettings.autoGuest) {
                    const guestRole = message.guild.roles.cache.find(role => role.name === guildSettings.guestRole);
                    if (!guestRole) return message.channel.send(`A guest role does not exist, or is not configured with the bot. Please contact a server Admin to fix.`);
                    message.member.roles.add(guestRole, "Verified UW ID through bot (guest)");
                    return message.channel.send(`Thanks for verifying as a guest, ${message.author}. Welcome to the server!`)
                } else {
                    return message.channel.send(`Error: You're not in ${guildSettings.verificationProgram}, and the server Admins did not enabled auto guest verification`);
                }
            }
        } else {
            return message.reply(`Invalid verification code. Please double check`);
        }
    }
}