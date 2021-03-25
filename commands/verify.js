const mongo = require('../mongo.js');
const fetch = require('node-fetch');
const settings = require('../settings.js');
const confirm = require('./confirm.js');

const nodemailer = require("nodemailer");
const mailAccount = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
    },
});

module.exports = {
    name: 'verify',
    description: 'Verify your UW identity for server access',
    args: true,
    guildOnly: true,
    displayHelp: false,
    async execute(message, args) {
        const guildSettings = settings.get(message.guild?.id);
        if (!guildSettings.verificationEnabled) {
            return message.reply('This server does not have verification enabled');
        }

        let uwid = args.toLowerCase().replace(/[^a-z0-9.@-]/g, "");

        if (uwid.endsWith("@uwaterloo.ca")) {
            uwid = uwid.slice(0, -13);
        }

        // check if user already exists
        const existingUser = await mongo.getDB().collection("users").findOne({ uwid: uwid });
        if (existingUser) {
            if (existingUser.discordID === message.author.id) {
                if (existingUser.verified) {
                    confirm.assignRole(message.member, existingUser).then(result => {
                        message.channel.send(result);
                    }).catch(error => {
                        message.channel.send(error);
                    });
                    return;
                } else {
                    return message.reply('We\'ve already sent you a verification code! Please check your email');
                }
                
            } else {
                return message.reply(`That user ID has already been registered. If you think this is a mistake, message <@${process.env.ADMIN_ID}>`, { "allowedMentions": { "users": [] } });
            }
        }

        
        let user = {
            discordID: message.author.id,
            department: '???',
            uwid: uwid,
            verified: false,
            token: Math.floor(Math.random() * 899999 + 100000)
        }
        mongo.getDB().collection("users").replaceOne({ discordID: message.author.id }, user, { upsert: true });

        mailAccount.sendMail({
            from: `"Sir Goose Bot" <${process.env.EMAIL}>`,
            to: `${uwid}@uwaterloo.ca`,
            subject: `UW Verification Code [${user.token}]`,
            text: `Token: ${user.token}`,
            html: `<b>HONK</b><br>
                Hey, your verification code is: <b>${user.token}</b><br>
                You can verify yourself using this command in the Discord channel:<br>
                <code>${guildSettings.prefix}confirm ${user.token}</code>
                <br><br>
                Also! If you have time, reply to this email with something random to prevent this account from being flagged as spam.
                <hr>
                This email was sent because a Discord user attempted to verify with your email. If you did not request this email, please ignore this message.`,
        });
        message.channel.send(
            `${message.author}, I'm sending a token to your UW email!\nGo ahead and type \`${settings.get(message.guild?.id).prefix}confirm TOKEN\` to finish the verification process`
        );
    }
}