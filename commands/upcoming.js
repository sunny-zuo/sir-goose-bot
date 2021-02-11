const Discord = require('discord.js');
const { DateTime } = require("luxon");
const mongo = require('../mongo.js');
const settings = require('../settings');
const userSettings = require('./userSettings');

module.exports = {
    name: 'upcoming',
    description: 'List deadlines and events within the next week. Use the `todohelp` for more information',
    aliases: ['todo'],
    usage: '[view type] [class]',
    args: false,
    guildOnly: false,
    displayHelp: true,
    async execute(message, args) {
        const argArray = (args) ? args.split(' ') : [];
        const possibleClasses = await mongo.getDB().collection("tasks").distinct("class");

        let viewType = "incomplete";
        let classView = null;
        for (arg of argArray) {
            if (arg === "complete" || arg === "incomplete" || arg === "all") {
                viewType = arg;
                continue;
            }
            
            for (let i = 0; i < possibleClasses.length; i++) {
                if (arg.toLowerCase().replace(" ", "") === possibleClasses[i].toLowerCase().replace(" ", "")) {
                    classView = possibleClasses[i];
                    break;
                };
            }

            if (classView) { continue; };
        }

        await this.sendEmbed(message, viewType, classView);
    },
    async sendEmbed(message, viewType = "incomplete", classView = null) {
        let pageSize = 7;
        let currentPage = 0;
        let taskCount = 0;

        const query = {
            endTime: { $gte: new Date() },
            completed: (viewType === "incomplete") ? { $not: { $eq: message.author.id } } : message.author.id,
            class: classView
        }

        if (query.class === null) { delete query.class };
        if (viewType === "all") { delete query.completed };

        taskCount = await mongo.getDB().collection("tasks").countDocuments(query);

        const filter = (reaction, user) => {
            return ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === message.author.id;
        };

        message.channel.send((await this.generateEmbed(message, query, pageSize, 0))).then(embedMessage => {
            if (taskCount > pageSize) {
                embedMessage.react('➡️');
            }
            const collector = embedMessage.createReactionCollector(filter, { time: 60000 });

            collector.on('collect', reaction => {
                embedMessage.reactions.removeAll().then(async () => {
                    reaction.emoji.name === '➡️' ? currentPage += 1 : currentPage -= 1;

                    embedMessage.edit((await this.generateEmbed(message, query, pageSize, currentPage)));

                    if (currentPage !== 0) {
                        await embedMessage.react('⬅️');
                    }
                    if ((currentPage + 1) * pageSize < taskCount) {
                        await embedMessage.react('➡️');
                    }
                })
            });

            collector.on('end', () => {
                embedMessage.reactions.removeAll();
            })
        })
    },
    async generateEmbed(message, query, pageSize, currentPage) {
        const fromDate = DateTime.local().setZone('America/Toronto');
        const midnightFrom = DateTime.local().setZone('America/Toronto').set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

        let events = await mongo.getDB().collection("tasks").find(query).sort({ endTime: 1 }).limit(pageSize).skip(currentPage * pageSize).toArray();;
        let viewDescr;
        if (!query.completed) {
            viewDescr = `All ${query.class ? `${query.class} ` : ''}Tasks`;
        } else if (query.completed === message.author.id) {
            viewDescr = `${message.author.username}'s Completed ${query.class ? `${query.class} ` : ''}Tasks`;
        } else {
            viewDescr = `${message.author.username}'s Incomplete ${query.class ? `${query.class} ` : ''}Tasks`;
        }

        const outputEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Upcoming Dates - ${viewDescr} (Page ${currentPage + 1})`)
            .setDescription(`Here are all upcoming quizzes, due dates, and other important dates. Please contact <@${process.env.ADMIN_ID}> if there are any issues!\n${settings.get('global').upcomingMessage}`)
            .setFooter('https://github.com/sunny-zuo/sir-goose-bot');


        for (currentEvent of events) {
            const startDt = DateTime.fromJSDate(currentEvent.startTime, { zone: 'America/Toronto' });
            const endDt = DateTime.fromJSDate(currentEvent.endTime, { zone: 'America/Toronto' });

            let startDateFormat;
            let endDateFormat;

            if (currentEvent.ignoreTime) {
                startDateFormat = `${startDt.toLocaleString({ month: 'long', day: 'numeric', weekday: 'long' })}`;
                endDateFormat = `${endDt.toLocaleString({ month: 'long', day: 'numeric', weekday: 'long' })}`;
            } else {
                startDateFormat = `${startDt.toLocaleString({ month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', weekday: 'long' })}`;
                endDateFormat = `${endDt.toLocaleString({ month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', weekday: 'long' })}`;
            }

            // Add relative times (in 1 day, in 5 hours, etc)
            endDateFormat += (fromDate.until(endDt).length('days') < 1) ? ` (${endDt.toRelative()})` : ` (${endDt.toRelative(midnightFrom)})`
            startDateFormat += (fromDate.until(startDt).length('days') < 1) ? ` (${startDt.toRelative()})` : ` (${startDt.toRelative(midnightFrom)})`

            if (startDt.equals(endDt)) {
                outputEmbed.addField(`${currentEvent.type}: ${currentEvent.name} for ${currentEvent.class} (#${currentEvent.seqId})`, endDateFormat)
            } else {
                outputEmbed.addField(`${currentEvent.type}: ${currentEvent.name} for ${currentEvent.class} (#${currentEvent.seqId})`, `Starts ${startDateFormat}\nDue ${endDateFormat}`)
            }

        }

        return outputEmbed;
    }
}

