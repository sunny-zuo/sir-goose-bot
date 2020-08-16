const dotenv = require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log(`Ready to go. Logged in as ${client.user.tag}`);
});

client.on('message', message => {
    if (!message.content.startsWith(process.env.PREFIX) || message.author.bot) return;

    const args = message.content.slice(process.env.PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (!client.commands.has(command)) {
        return;
    }

    try {
        client.commands.get(command).execute(message, args);
    } catch (err) {
        console.error(err);
        message.reply('We ran into an error trying to exceute that command')
    }
})

client.login(process.env.DISCORD_TOKEN);