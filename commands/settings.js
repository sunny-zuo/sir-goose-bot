const Discord = require('discord.js');
const settings = require('../settings.js');

module.exports = {
    name: 'settings',
    description: 'List all of the server\'s settings or edit them',
    args: false,
    guildOnly: true,
    displayHelp: true,
    usage: "(setting) (new value)",
    execute(message, args) {
        const subArgs = args?.trim().split(/ (.+)/);
        
        // if the user attempts to change a setting
        if (subArgs?.length >= 2) {
            
        }
        
        // if the user wants more info on a specific setting
        else if (subArgs?.length === 1) {

        }

        // if the user wants general settings info
        else {
            const serverSetting = { ...settings.get(message.guild.id) };
            const keys = Object.keys(serverSetting);

            let settingsString = "";
            for (let key in keys) {
                if (!["serverID", "_id"].includes(keys[key])) {
                    settingsString += `**${keys[key]}**: ${serverSetting[keys[key]]}\n`;
                }
            }

            const settingListEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .addFields(
                    { name: `__${message.guild.name} Settings__`, value: settingsString },
                )
            return message.channel.send(settingListEmbed);
        }
    }
}