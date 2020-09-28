const mongo = require('../mongo.js');
const fetch = require('node-fetch');

const settings = require('../settings.js');

module.exports = {
    name: 'confirm',
    description: 'Confirm your UW identity using the code given',
    args: true,
    guildOnly: true,
    displayHelp: false,
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
            await mongo.getDB().collection("users").updateOne( { discordID: message.author.id }, { $set : { verified: true }});
            this.assignRole(message.member, user).then(result => {
                message.channel.send(result);
            }).catch(error => {
                message.channel.send(error);
            });
            return;
        } else {
            return message.reply(`Invalid verification code. Please double check`);
        }
    },
    async assignRole(member, user) {
        return new Promise((resolve, reject) => {
            if (!member?.guild?.id) reject('Error: Roles cannot be given in DMs');
            const guildSettings = settings.get(member.guild.id);
            if (!guildSettings) reject('Error: Could not get guild settings.');
            if (!user) reject('Error: Could not get user information');

            if (user.program === guildSettings.verificationProgram) {
                const verifiedRole = member.guild.roles.cache.find(role => role.name === guildSettings.verifiedRole);
                if (!verifiedRole) reject(`The verified role does not exist, or is not configured with the bot. Please contact a server Admin to fix.`);

                member.roles.add(verifiedRole, "Verified UW ID through bot");
                resolve(`Thanks for verifying, ${member.user}. Welcome to the server!`);
            } else {
                if (guildSettings.autoGuest) {
                    const guestRole = member.guild.roles.cache.find(role => role.name === guildSettings.guestRole);
                    if (!guestRole) reject(`A guest role does not exist, or is not configured with the bot. Please contact a server Admin to fix.`);
                    member.roles.add(guestRole, "Verified UW ID through bot (guest)");
                    resolve(`Thanks for verifying as a guest, ${member.user}. Welcome to the server!`);
                } else {
                    reject(`Error: You're not in ${guildSettings.verificationProgram}, and the server Admins did not enable auto guest verification.`);
                }
            }
        });
    }
}