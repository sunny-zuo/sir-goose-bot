const randomGoose = "https://source.unsplash.com/random?goose,geese";
const Discord = require("discord.js");
const fetch = require("node-fetch");

module.exports = {
    name: "honk",
    description: "Honk!",
    args: false,
    guildOnly: false,
    displayHelp: true,
    async execute(message) {
        if (Math.random() < 0.4) {
            const redirectedGoose = await fetch(randomGoose, {
                redirect: "follow",
            }).then((r) => r.url);
            const embed = new Discord.MessageEmbed()
                .setColor("#c51837")
                .setTitle("HONK HONK")
                .setImage(redirectedGoose);
            message.channel.send(embed);
        } else {
            message.channel.send("HONK");
        }
    },
};
