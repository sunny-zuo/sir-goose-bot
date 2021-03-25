const mongo = require('../mongo.js');
const fetch = require('node-fetch');
const Discord = require('discord.js');

const settings = require('../settings.js');

module.exports = {
    name: 'confirm',
    description: 'Confirm your UW identity using the code given',
    args: false,
    guildOnly: false,
    displayHelp: false,
    async execute(message, args) {
        message.channel.send(`${message.author}`, {
            embed: new Discord.MessageEmbed().setColor("#ff0000")
                .setTitle('Command No Longer Supported')
                .setDescription(`We've migrated to OAuth verification, so all pending verifications have been deleted. Please verify again using \`${process.env.PREFIX}verify\``)
        })
    }
}