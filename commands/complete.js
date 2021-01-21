const Discord = require('discord.js');
const mongo = require('../mongo.js');
const settings = require('../settings');

module.exports = {
    name: 'complete',
    description: 'Mark a task as completed',
    args: true,
    guildOnly: false,
    displayHelp: true,
    async execute(message, args) {
        const id = parseFloat(args.split(' ')[0].replace(/[^0-9]/g, ''));
        const task = await mongo.getDB().collection("tasks").findOne({ seqId: id });
        if (!task) {
            message.channel.send(new Discord.MessageEmbed().setColor("#ff0000")
                .setTitle('Error: Invalid Task ID')
                .setDescription(`No task with the ID ${id} was found`)
                .setFooter('https://github.com/sunny-zuo/sir-goose-bot'))
            return;
        }

        await mongo.getDB().collection("tasks").updateOne({ seqId: id }, { $push: { completed: message.author.id }});
        message.channel.send(new Discord.MessageEmbed().setColor("#00ff00")
            .setTitle('Success')
            .setDescription(`Marked task '${task.name}' from class ${task.class} as completed!\nIf this was a mistake, use \`${settings.get(message.guild?.id).prefix}incomplete ${id}\``)
            .setFooter('https://github.com/sunny-zuo/sir-goose-bot'))
        return;
    }
}