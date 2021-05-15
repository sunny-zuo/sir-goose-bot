const Discord = require('discord.js');
const mongo = require('../mongo.js');
const CryptoJS = require('crypto-js');
const settings = require('../settings.js');
const { assignRole } = require('../server/server');

module.exports = {
    name: 'verify',
    description: 'Verify your UW identity for server access',
    args: false,
    guildOnly: false,
    displayHelp: true,
    async execute(message, args) {
        const guildSettings = settings.get(message.guild?.id);
        if (!guildSettings.verificationEnabled) {
            return message.reply('this server does not have verification enabled.');
        }

        const encodedUID = CryptoJS.AES.encrypt(`${message.author.id}-sebot`, process.env.AES_PASSPHRASE).toString().replace(/\//g, '_').replace(/\+/g, '-');

        const existingUser = await mongo.getDB().collection("users").findOne({ discordId: message.author.id });
        if (existingUser && existingUser.givenName) {
            try {
                assignRole(message.guild, guildSettings, message.member, existingUser);
                message.channel.send(`${message.author}`, {
                    embed: new Discord.MessageEmbed().setColor("#00ff00")
                        .setTitle('Verified Successfully!')
                        .setDescription('You\'ve been successfully verified!')
                })
            } catch (e) {
                console.log('Verification Error', e);
            }
            return;
        }

        if (message.guild == null) {
            message.author.send(new Discord.MessageEmbed().setColor("#00ff00")
                .setTitle('Verification Prompt')
                .setDescription(`[Click here to login using your UWaterloo account to verify.](${process.env.SERVER_URI}/verify/${encodedUID})
                Authorization allows us to read your profile information to confirm that you are/were a UW student, and you can revoke this permission at any time.
                If you run into issues, message <@!282326223521316866> for help!
                
                If you're an applicant, unfortunately you won't be unable to verify until June when your email is activated. Check if the server has alternate verification methods.`));
        } else {
            try {
                message.author.send(new Discord.MessageEmbed().setColor("#00ff00")
                    .setTitle('Verification Prompt')
                    .setDescription(`[Click here to login using your UWaterloo account to verify.](${process.env.SERVER_URI}/verify/${encodedUID})
                Authorization allows us to read your profile information to confirm that you are/were a UW student, and you can revoke this permission at any time.
                If you run into issues, message <@!282326223521316866> for help!
                

                **For Applicants:** Unfortunately you won't be unable to verify until June when your email is activated. Check if the server has alternate verification methods.`));
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