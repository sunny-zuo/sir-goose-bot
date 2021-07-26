const Discord = require('discord.js');
const mongo = require('../mongo.js');
const settings = require('../settings.js');

async function getUserFromMention(guild, mention) {
    const matches = mention.match(/^<@!?(\d+)>$/);
    if (!matches) return;
    const id = matches[1];
    const member = await guild.members.fetch(id);
    return member;
}


module.exports = {
    name: 'ban',
    description: 'Bans all alts of a verified Discord user using their Waterloo ID.',
    args: true,
    guildOnly: true,
    displayHelp: true,
    permissions: ['BAN_MEMBERS'],
    async execute(message, args) {
        const guild = message.guild;
        const guildSettings = settings.get(message.guild?.id);
        if (!guildSettings.verificationEnabled) {
            return message.reply('this server does not have verification enabled');
        }

        if (!guild.me.hasPermission('BAN_MEMBERS')) {
            return message.reply('the bot does not have permission to ban users.');
        }

        const member = await getUserFromMention(guild, args);
        if (!member) return message.reply('I could not find the user to ban. Make sure they are mentioned and in the guild.');

        message.channel.send(
            `Permanantly banning ${member} and all alt accounts.`
        );
        await guild.members.fetch();

        // get specified user's UWID
        const { uwid: userUWID } = await mongo.getDB().collection("users").findOne({ discordId: member.id });
        let altCounter = 0;
        // find all other discord accounts that share this UWID
        for await (const alt of mongo.getDB().collection("users").find({ uwid: userUWID })) {
          if (alt.discordId !== member.id && guild.members.cache.has(alt.discordId)) {
              // ban user
              await guild.members.ban(alt.discordId, { reason: `Banned by ${message.author.tag} (${message.author.id}) - user was alt` });
              altCounter++;
          }
        }

        member.send(`You have been permanently banned from the server "${guild.name}".`);
        await guild.members.ban(member, { reason: `Banned by ${message.author.tag} (${message.author.id})` });

        await mongo
            .getDB()
            .collection("settings")
            .updateOne(
                { serverID: guild.id },
                { $push: { bans: userUWID } }
            );

        message.channel.send(`The user ${member} has been banned along with ${altCounter} alts.`);
    }
}