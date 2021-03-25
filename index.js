const dotenv = require('dotenv').config();
const authServer = require('./server/server');
const fs = require('fs');
const Discord = require('discord.js');
const mongo = require('./mongo.js');
const settings = require('./settings.js');
const confirm = require('./commands/confirm');

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
};

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    authServer.init(client);
    client.user.setActivity("~help");
    const dbConnection = await mongo.connectDB();
    if (dbConnection.success) {
        console.log('Connected to database successfully');
        await settings.loadSettings();
    } else {
        console.error(dbConnection.err);
    }
});

client.on('message', message => {
    const prefix = settings.get(message.guild?.id).prefix
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ (.+)/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if (command.guildOnly && message.channel.type === 'dm') {
        return message.reply('That command can\'t be used in DMs.');
    }

    if (command.args && args.length === 0) {
        return message.reply(`The ${commandName} command requires arguments`);
    }

    if (command.permissions) {
        if (!message.member.hasPermission(command.permissions)) {
            return message.reply(`You need the following permissions to use this command: ${JSON.stringify(command.permissions)}`);
        }
    }

    if (command.ownerOnly && message.author.id !== process.env.ADMIN_ID) {
        return message.reply('only the bot owner can use this command');
    }

    try {
        command.execute(message, args[0]);
    } catch (err) {
        console.error(err);
        message.reply('We ran into an error trying to exceute that command')
    }
});

client.on('guildMemberAdd', async (member) => {
    const serverSettings = settings.get(member.guild.id);
    if (serverSettings.verificationEnabled) {
        const user = await mongo.getDB().collection("users").findOne({ discordId: member.id });
        if (user) {
            authServer.assignRole(member.guild, serverSettings, member, user).then(() => {
                member.send(`Since you've verified with the bot in the past, you've been automatically verified in ${member.guild.name}. Welcome!`);
            }).catch(err => { console.log(`Error with auto verification: ${err}`) });
        };
    }
});

client.login(process.env.DISCORD_TOKEN);