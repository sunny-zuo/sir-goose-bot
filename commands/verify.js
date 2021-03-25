const Discord = require('discord.js');
const mongo = require('../mongo.js');
const CryptoJS = require('crypto-js');
const settings = require('../settings.js');

module.exports = {
    name: 'verify',
    description: 'Verify your UW identity for server access',
    args: false,
    guildOnly: false,
    displayHelp: false,
    async execute(message, args) {
        const guildSettings = settings.get(message.guild?.id);
        if (!guildSettings.verificationEnabled) {
            return message.reply('This server does not have verification enabled');
        }

        const encodedUID = CryptoJS.AES.encrypt(`${message.author.id}-sebot`, process.env.AES_PASSPHRASE).toString().replace(/\//g, '_').replace(/\+/g, '-');

        const existingUser = await mongo.getDB().collection("users").findOne({ discordId: message.author.id });
        if (existingUser) {
            try {
                message.author.send(`You are already verified! You can try to reverify if you want using the below link (and update your profile info, including faculty), but it likely won't make a difference.`);
                message.author.send(new Discord.MessageEmbed().setColor("#00ff00")
                    .setTitle('Verification Prompt')
                    .setDescription(`[Click here to login using your UWaterloo account to verify.](${process.env.SERVER_URI}/verify/${encodedUID})
                Authorization allows us to read your profile information to confirm that you are/were a UW student, and you can revoke this permission at any time.
                If you run into issues, message <@!282326223521316866> for help!`));
                if (message.guild != null) {
                    message.channel.send(`${message.author}, we've DMed you a verification link. Please check your DMs!`);
                }
            } catch (e) {
                message.channel.send(`${message.author}`, {
                    embed: new Discord.MessageEmbed().setColor("#00ff00")
                        .setTitle('Unable to DM Verification Link')
                        .setDescription('We seem to be unable to DM you a verification link. Please [temporarily change your privacy settings](https://cdn.discordapp.com/attachments/811741914340393000/820114337514651658/permissions.png) to allow direct messages from server members in order to verify.')
                })
            }
            return;
        }

        if (message.guild == null) {
            message.author.send(new Discord.MessageEmbed().setColor("#00ff00")
                .setTitle('Verification Prompt')
                .setDescription(`[Click here to login using your UWaterloo account to verify.](${process.env.SERVER_URI}/verify/${encodedUID})
                Authorization allows us to read your profile information to confirm that you are/were a UW student, and you can revoke this permission at any time.
                If you run into issues, message <@!282326223521316866> for help!`));
        } else {
            try {
                message.author.send(new Discord.MessageEmbed().setColor("#00ff00")
                    .setTitle('Verification Prompt')
                    .setDescription(`[Click here to login using your UWaterloo account to verify.](${process.env.SERVER_URI}/verify/${encodedUID})
                Authorization allows us to read your profile information to confirm that you are/were a UW student, and you can revoke this permission at any time.
                If you run into issues, message <@!282326223521316866> for help!`));
                message.channel.send(`${message.author}, we've DMed you a verification link. Please check your DMs!`);
            } catch (e) {
                message.channel.send(`${message.author}`, {
                    embed: new Discord.MessageEmbed().setColor("#00ff00")
                        .setTitle('Unable to DM Verification Link')
                        .setDescription('We seem to be unable to DM you a verification link. Please [temporarily change your privacy settings](https://cdn.discordapp.com/attachments/811741914340393000/820114337514651658/permissions.png) to allow direct messages from server members in order to verify.')
                })
            }
            return;
        }

    }
}