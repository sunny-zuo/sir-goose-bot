const mongo = require('../mongo.js');
const fetch = require('node-fetch');
const Discord = require('discord.js');

const settings = require('../settings.js');

module.exports = {
    name: 'confirm',
    description: 'Confirm your UW identity using the code given',
    args: false,
    guildOnly: false,
    displayHelp: false,
    async execute(message, args) {
        message.channel.send(`${message.author}`, {
            embed: new Discord.MessageEmbed().setColor("#ff0000")
                .setTitle('Command No Longer Supported')
                .setDescription(`We've migrated to OAuth verification, so all pending verifications have been deleted. Please verify again using \`${process.env.PREFIX}verify\``)
        })
    },
    // TODO: Migrate to dedicated role assignment config
    async assignRole(member, user) {
        return new Promise((resolve, reject) => {
            if (!member?.guild?.id) reject('Error: Roles cannot be given in DMs');
            const guildSettings = settings.get(member.guild.id);
            if (!guildSettings) reject('Error: Could not get guild settings.');
            if (!user) reject('Error: Could not get user information');

            if (user.department === guildSettings.verificationProgram) {
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