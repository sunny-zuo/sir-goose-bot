const Discord = require('discord.js');
const { DateTime } = require("luxon");
const mongo = require('../mongo.js');
const settings = require('../settings');

module.exports = {
    name: 'upcoming',
    description: 'List deadlines and events within the next week.',
    usage: '[days = 7] [view type]',
    args: false,
    guildOnly: false,
    displayHelp: true,
    async execute(message, args) {
        const argArray = (args) ? args.split(' ') : [];
        const daysToView = (argArray[0]) ? argArray[0] : 7;
        const viewType = (argArray[1]) ? argArray[1].toLowerCase() : "incomplete"

        if (daysToView && isNaN(parseFloat(daysToView))) {
            message.channel.send(new Discord.MessageEmbed().setColor('#FF0000').setTitle('Error').setDescription('You did not provide a valid number of days to display.').setFooter('https://github.com/sunny-zuo/sir-goose-bot'));
            return;
        }
        const fromDate = DateTime.utc();
        const toDate = DateTime.fromJSDate(new Date(new Date().setHours(24, 0, 0, 0)), { zone: 'America/Toronto' }).plus({ days: daysToView })
        
        let events;
        let viewDescr;
        if (viewType === "all" || viewType === "everything") {
            events = await mongo.getDB().collection("tasks").find({ endTime: { $gte: fromDate.toJSDate(), $lte: toDate.toJSDate() } }).sort({ endTime: 1 }).toArray();
            viewDescr = "All Tasks"
        } else if (viewType === "incomplete") {
            events = await mongo.getDB().collection("tasks").find({ endTime: { $gte: fromDate.toJSDate(), $lte: toDate.toJSDate() }, completed: { $not: { $eq: message.author.id }}}).sort({ endTime: 1 }).toArray();
            viewDescr = `${message.author.username}'s Incomplete Tasks`
        } else if (viewType === "complete" || viewType === "completed") {
            events = await mongo.getDB().collection("tasks").find({ endTime: { $gte: fromDate.toJSDate(), $lte: toDate.toJSDate() }, completed: message.author.id }).sort({ endTime: 1 }).toArray();
            viewDescr = `${message.author.username}'s Completed Tasks`
        } else {
            message.channel.send(new Discord.MessageEmbed().setColor('#FF0000').setTitle('Error').setDescription('You did not provide a valid display type. Valid options: `all`, `incomplete`, `complete`').setFooter('https://github.com/sunny-zuo/sir-goose-bot'));
            return;
        }

        const outputEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Upcoming Dates for SE 25 - ${viewDescr}`)
            .setDescription(`These are all upcoming quizzes, due dates, and other important dates for the upcoming week. Please contact <@${process.env.ADMIN_ID}> if there are any issues!\n${settings.get('global').upcomingMessage}`)
            .setFooter('https://github.com/sunny-zuo/sir-goose-bot');


        for (currentEvent of events) {
            const startDt = DateTime.fromJSDate(currentEvent.startTime, { zone: 'America/Toronto' });
            const endDt = DateTime.fromJSDate(currentEvent.endTime, { zone: 'America/Toronto' });

            let startDateFormat;
            let endDateFormat;

            if (currentEvent.ignoreTime) {
                startDateFormat = `${startDt.toLocaleString({ month: 'long', day: 'numeric', weekday: 'long' })} (${startDt.toRelative()})`;
                endDateFormat = `${endDt.toLocaleString({ month: 'long', day: 'numeric', weekday: 'long' })} (${endDt.toRelative()})`;
            } else {
                startDateFormat = `${startDt.toLocaleString({ month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', weekday: 'long' })} (${startDt.toRelative()})`;
                endDateFormat = `${endDt.toLocaleString({ month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', weekday: 'long' })} (${endDt.toRelative()})`;
            }

            if (startDt.equals(endDt)) {
                outputEmbed.addField(`${currentEvent.type}: ${currentEvent.name} for ${currentEvent.class} (#${currentEvent.seqId})`, endDateFormat)
            } else {
                outputEmbed.addField(`${currentEvent.type}: ${currentEvent.name} for ${currentEvent.class} (#${currentEvent.seqId})`, `Starts ${startDateFormat}\nDue ${endDateFormat}`) 
            }
            
        }

        message.channel.send(outputEmbed);
    }
}

