const Discord = require('discord.js');
const mongo = require('../mongo.js');
const settings = require('../settings');

module.exports = {
    name: 'complete',
    description: 'Mark a task as completed',
    aliases: ['completed', 'c'],
    args: true,
    guildOnly: false,
    displayHelp: true,
    async execute(message, args) {
        const taskIds = args.split(' ');
        let resultText = '';
        for (taskId of taskIds) {
            const id = parseFloat(taskId.replace(/[^0-9]/g, ''));
            const task = await mongo.getDB().collection("tasks").findOne({ seqId: id });

            if (!task) {
                resultText += `No task with the ID ${taskId} was found\n`
            } else {
                await mongo.getDB().collection("tasks").updateOne({ seqId: id }, { $push: { completed: message.author.id } });
                resultText += `Marked task '${task.name}' (#${task.seqId}) from class ${task.class} as completed\n`
            }
        }

        message.channel.send(new Discord.MessageEmbed().setColor("#00ff00")
            .setTitle('Marked Tasks as Complete')
            .setDescription(`${resultText}\nIf this was a mistake, use \`${settings.get(message.guild?.id).prefix}incomplete <id>\` to undo`)
            .setFooter('https://github.com/sunny-zuo/sir-goose-bot'))
        return;
    }
}