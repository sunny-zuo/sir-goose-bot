const mongo = require('../mongo');
const fetch = require('node-fetch');

module.exports = {
    name: 'verify',
    description: 'Verify your UW identity for server access',
    args: true,
    guildOnly: true,
    async execute(message, args) {
        let uwid = args[0].toLowerCase().replace(/[^a-z0-9.@-]/g, "");

        if (uwid.endsWith("@uwaterloo.ca")) {
            uwid = uwid.slice(0, -13);
        }

        /* add checks to see if user exists
        mongo.getDB().collection("users").findOne({ uwid: uwid }).then((user) => {
            if (user) {
                return message.reply(`That user ID has already been registered. If you think this is a mistake, message <@${process.env.ADMIN_ID}>`, { "allowedMentions": { "users": [] } });
            }
        });*/

        const request = await fetch(`https://api.uwaterloo.ca/v2/directory/${uwid}.json?key=${process.env.UW_API_KEY}`);
        const userData = await request.json();

        let user = {
            discordID: message.author.id,
            program: userData.data.department,
            uwid: [],
            verified: false,
            token: Math.floor(Math.random() * 899999 + 100000)
        }
        userData.data.email_addresses.forEach(email => {
            user.uwid.push(email.slice(0, -13));
        });
        mongo.getDB().collection("users").insertOne(user);
        console.log(user);
    }
}