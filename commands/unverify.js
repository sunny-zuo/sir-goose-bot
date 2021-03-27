const mongo = require('../mongo.js');
const settings = require('../settings.js');

module.exports = {
    name: 'unverify',
    description: 'Unlink your UW identity and delete all of your user data. This will remove any verified roles that you have.',
    args: false,
    guildOnly: false,
    displayHelp: false,
    async execute(message, args) {
        message.channel.send(`${message.author}`, {
            embed: new Discord.MessageEmbed().setColor("#ff0000")
                .setTitle('Temporarily Unavailable')
                .setDescription(`Unverifying is currently unavailable due to the OAuth migration causing significant changes with how we store your data.`)
        })
    }
}