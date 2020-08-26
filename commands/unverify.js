const mongo = require('../mongo.js');
const settings = require('../settings.js');

module.exports = {
    name: 'unverify',
    description: 'Unlink your UW identity and delete all of your user data. This will remove any verified roles that you have.',
    args: false,
    guildOnly: false,
    displayHelp: false,
    async execute(message, args) {
        const user = await mongo.getDB().collection("users").findOne({ discordID: message.author.id });

        if (!user) {
            return message.author.send('You have not verified with the bot, so there\'s nothing to unverify');
        }

        message.client.guilds.cache.forEach(guild => {
            const guildSettings = settings.get(guild.id);
            // if bot has verification enabled & perms to manage roles, attempt to find the member in that guild
            if (guild.me.hasPermission("MANAGE_ROLES") && guildSettings.verificationEnabled) {
                const member = guild.member(message.author);
                if (!member) return;

                if (guildSettings.verificationProgram === user.program) {
                    const verifiedRole = guild.roles.cache.find(role => role.name === guildSettings.verifiedRole);
                    if (member.roles.cache.find(role => role.name === guildSettings.verifiedRole)) {
                        member.roles.remove(verifiedRole, "User manually unverified");
                    }
                } else if (guildSettings.autoGuest) {
                    const guestRole = guild.roles.cache.find(role => role.name === guildSettings.guestRole);
                    if (member.roles.cache.find(role => role.name === guildSettings.guestRole)) {
                        member.roles.remove(guestRole, "User manually unverified");
                    }
                }
            }
        });

        await mongo.getDB().collection("users").deleteOne({ discordID: message.author.id });
        message.author.send('You\'ve been successfully unverified, and your user data for the bot has been deleted.');
    }
}