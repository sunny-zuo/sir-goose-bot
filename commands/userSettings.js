const Discord = require('discord.js');
const mongo = require('../mongo.js');
const serverSettings = require('../settings.js');

const defaultSettings = {
    todoDefaultDays: 7,
}

const settingsInfo = {
    todoDefaultDays: 'Set the default number of days into the future the upcoming command will show'
}

module.exports = {
    name: 'settings',
    description: 'List all of the server\'s settings or edit them',
    aliases: ['setting'],
    args: false,
    guildOnly: false,
    displayHelp: true,
    usage: "(setting) (new value)",
    async execute(message, args) {
        const subArgs = args?.trim().split(/ (.+)/);
        if (subArgs?.length >= 2) {
            const blacklistedKeys = ["discordID", "_id"];
            let settings = await this.get(message.author.id);

            if (settings[subArgs[0]] !== undefined && !blacklistedKeys.includes(subArgs[0])) {
                newVal = (typeof settings[subArgs[0]] === "boolean") ? (subArgs[1] == 'true') : subArgs[1];
                await this.set(message.author.id, subArgs[0], newVal);
                return message.channel.send({ content: 'Setting updated successfully. New settings:', embed: await this.buildSettingListEmbed(message) })
            } else {
                return message.reply(`That setting does not exist. Please note that settings are **case sensitive**! Use \`${serverSettings.get(message.guild.id).prefix}settings\` for a list of settings.`);
            }
        } else if (subArgs?.length === 1) {
            let settings = await this.get(message.author.id);

            if (settings[subArgs[0]]) {
                const settingInfoEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(`Setting: ${subArgs[0]}`)
                    .setDescription(settingsInfo[subArgs[0]] + `\n**Current Value:** ${settings[subArgs[0]]}`);
                return message.channel.send(settingInfoEmbed);
            } else {
                return message.reply(`That setting does not exist. Please note that settings are **case sensitive**! Use \`${serverSettings.get(message.guild.id).prefix}settings\` for a list of settings.`);
            }
        } else {
            const settingListEmbed = await this.buildSettingListEmbed(message);
            return message.channel.send(settingListEmbed);
        }
    },
    async get(discordID) {
        const settings = await mongo.getDB().collection("userSettings").findOne({ discordID: discordID });
        if (settings) { return settings }
        else { return defaultSettings };
    },
    async set(discordID, key, value) {
        const settings = await this.get(discordID);
        settings[key] = value;
        settings.discordID = discordID;
        return mongo.getDB().collection("userSettings").replaceOne({ discordID: discordID }, settings, { upsert: true });
    },
    async buildSettingListEmbed(message) {
        const settings = await this.get(message.author.id);
        const prefix = serverSettings.get(message.guild.id).prefix;

        const keys = Object.keys(settings);

        const blacklistedKeys = ["discordID", "_id"];

        let settingsString = "";
        for (let key in keys) {
            if (!blacklistedKeys.includes(keys[key])) {
                settingsString += `**${keys[key]}**: ${settings[keys[key]]}\n`;
            }
        }

        const settingListEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`${message.author.username}'s Settings`)
            .setDescription(
                `View and manage user settings. For server settings, use \`${prefix}config\`
                Use \`${prefix}settings <setting>\` for a description of each setting
                Use \`${prefix}settings <setting> <new value>\` to modify values`
            ).addFields({ name: '__Settings__', value: settingsString });

        return settingListEmbed;
    }
}