const randomGoose = "https://source.unsplash.com/random?goose,geese";
const Discord = require("discord.js");

module.exports = {
    name: 'honk',
    description: 'Honk!',
    args: false,
    guildOnly: false,
    displayHelp: true,
    execute(message) {
        if (Math.random() < 0.4) {
            const embed = new Discord.MessageEmbed()
                .setColor("#c51837")
                .setTitle("HONK HONK")
                .setImage(randomGoose);
            message.channel.send(embed);
        } else {
            message.channel.send('HONK');
        }
        
    }
}