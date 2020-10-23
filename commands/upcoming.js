const Discord = require('discord.js');
const fs = require('fs');
const { DateTime } = require("luxon");

module.exports = {
    name: 'upcoming',
    description: 'List deadlines and events within the next week. Currently only supports SE 25.',
    args: false,
    guildOnly: false,
    displayHelp: true,
    async execute(message, args) {
        const data = JSON.parse(fs.readFileSync('./data/se25.json', 'utf-8'));
        const fromDate = Date.now();
        const toDate = fromDate + 1000 * 60 * 60 * 24 * 7 // ms => s => hr = > day => week
        
        const events = [];
        
        for (let i = 0; i < data.length; i++) {
            if (data[i].time >= fromDate && data[i].time <= toDate) {
                events.push(data[i]);
            }
        }

        events.sort((a, b) => {
            if (a.time > b.time) {
                return 1;
            }
            if (b.time > a.time) {
                return -1;
            }
            return 0;
        })

        const outputEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Upcoming Dates for SE 25')
            .setDescription(`These are all upcoming quizzes, due dates, and other important dates for the upcoming week. Please contact <@${process.env.ADMIN_ID}> if there are any issues`)
            .setFooter('https://github.com/sunny-zuo/sir-goose-bot');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        for (currentEvent of events) {
            const dt = DateTime.fromMillis(currentEvent.time, { zone: 'America/Toronto' });
            // if there is no specific time, trim it
            let dateFormat;
            if ((currentEvent.time - 1000 * 60 * 60 * 6) % (1000 * 60 * 60 * 24) == 0) {
                dateFormat = `${dt.toLocaleString({ month: 'long', day: 'numeric', weekday: 'long' })} (${dt.toRelative()})`;
            } else {
                dateFormat = `${dt.toLocaleString({ month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', weekday: 'long' })} (${dt.toRelative()})`;
            }

            outputEmbed.addField(`${currentEvent.type}: ${currentEvent.name} for ${currentEvent.class}`, dateFormat)
        }

        message.channel.send(outputEmbed);
    }
}

