const Discord = require('discord.js');
const mongo = require('../mongo.js');

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
            message.channel.send(new Discord.MessageEmbed().setColor("#9932cc")
                .setTitle('Error: Invalid Task ID')
                .setDescription(`No task with the ID ${id} was found`))
            return;
        }

        await mongo.getDB().collection("tasks").updateOne({ seqId: id }, { $push: { completed: message.author.id }});
        message.channel.send(new Discord.MessageEmbed().setColor("#9932cc")
            .setTitle('Success')
            .setDescription(`Marked task '${task.name}' from class ${task.class} as completed!`))
        return;
    }
}