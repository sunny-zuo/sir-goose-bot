const Discord = require("discord.js");
const fetch = require("node-fetch");
const { DateTime } = require("luxon");

let examsEndDate;
let termEndDate;

module.exports = {
    name: "countdown",
    description: "Count the number of days until the current academic term is over",
    aliases: ['fml', 'count'],
    args: false,
    guildOnly: false,
    displayHelp: true,
    async execute(message) {
        if (!examsEndDate || DateTime.local() > termEndDate) {
            const currentTermResponse = await fetch('https://openapi.data.uwaterloo.ca/v3/Terms/current', {
                method: 'GET',
                headers: {
                    'X-API-KEY': process.env.UW_API_KEY
                }
            });
            const currentTerm = await currentTermResponse.json();
            termEndDate = DateTime.fromISO(currentTerm.termEndDate, { zone: 'America/Toronto' });

            const importantDateResponse = await fetch('https://openapi.data.uwaterloo.ca/v3/ImportantDates', {
                method: 'GET',
                headers: {
                    'X-API-KEY': process.env.UW_API_KEY
                }
            });
            const importantDates = await importantDateResponse.json();

            const examEndEvent = importantDates.find(date => date?.name === "Final examinations end" && date?.details?.some(detail => detail?.termName === currentTerm.name));
            examsEndDate = DateTime.fromISO(examEndEvent.details.find(detail => detail?.termName === currentTerm.name ).startDate);
        }

        let timeDiff = examsEndDate.diff(DateTime.local(), 'days');
        message.channel.send(`There are about ${Math.floor(timeDiff.values.days)} more days until this term is over!`);
    }
};
