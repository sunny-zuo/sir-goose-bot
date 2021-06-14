const randomGoose = "https://source.unsplash.com/random?goose,geese";
const Discord = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
    name: "invite",
    description: "Get an invite link to add this bot to your server.",
    args: false,
    guildOnly: false,
    displayHelp: true,
    async execute(message) {
        const embed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Bot Invite Link')
            .setDescription(`Want an invite link to add this bot to your server? Message <@${process.env.ADMIN_ID}>; he'll be happy to give you a link and help you get everything setup!`);
        message.channel.send(embed);
    },
};
