const Discord = require('discord.js');
const mongo = require('../mongo.js');

module.exports = {
    name: 'incomplete',
    description: 'Mark a task as incomplete',
    args: true,
    guildOnly: false,
    displayHelp: true,
    async execute(message, args) {
        const id = parseFloat(args.split(' ')[0].replace(/[^0-9]/g, ''));
        const task = await mongo.getDB().collection("tasks").findOne({ seqId: id });
        if (!task) {
            message.channel.send(new Discord.MessageEmbed().setColor("#ff0000")
                .setTitle('Error: Invalid Task ID')
                .setDescription(`No task with the ID ${id} was found`))
            return;
        }

        await mongo.getDB().collection("tasks").updateOne({ seqId: id }, { $pull: { completed: message.author.id } });
        message.channel.send(new Discord.MessageEmbed().setColor("#00ff00")
            .setTitle('Success')
            .setDescription(`Marked task '${task.name}' from class ${task.class} as incomplete!`))
        return;
    }
}