const dotenv = require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');
const mongo = require('./mongo');
const settings = require('./settings');

const client = new Discord.Client();
client.commands = new Discord.Collection();

let db;
mongo.connectDB().then(result => {
    if (result.success) {
        db = mongo.getDB();
        console.log('Connected to database successfully');
    } else {
        throw result.err;
    }
}).catch(err => {
    console.error(err);
});


const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log(`Ready to go. Logged in as ${client.user.tag}`);
});

client.on('message', message => {
    const prefix = settings.get(message.guild?.id).prefix
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (!command) return;

    if (command.guildOnly && message.channel.type === 'dm') {
        return message.reply('That command can\'t be used in DMs.');
    }

    if (command.args && args.length === 0) {
        return message.reply(`The ${commandName} command requires arguments, ${message.author}`);
    }

    try {
        command.execute(message, args);
    } catch (err) {
        console.error(err);
        message.reply('We ran into an error trying to exceute that command')
    }
});

client.login(process.env.DISCORD_TOKEN);