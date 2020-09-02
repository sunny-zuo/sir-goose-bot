const Discord = require('discord.js');
const settings = require('../settings.js');

const settingsInfo = {
    prefix: 'The prefix that the bot responds to in the server. It is `~` by default.',
    verificationEnabled: 'Set whether or not the bot should verify UW students and assign roles. Either `true` or `false`.',
    verificationProgram: 'The UW program to verify for, formatted the same way as shown on WatIAM. Example: `VPA/Software Engineering`',
    verifiedRole: 'The name of the role to assign if the user belongs to the specified verificationProgram',
    guestRole: 'The name of the role to assign if the user verifies as a UW student but is in a different program. Can be disabled by setting the autoGuest setting to false',
    autoGuest: 'Set whether or not the bot should assign the specified guestRole to users who are in a different program. Either `true` or `false`'
}

module.exports = {
    name: 'settings',
    description: 'List all of the server\'s settings or edit them',
    args: false,
    guildOnly: true,
    displayHelp: true,
    usage: "(setting) (new value)",
    execute(message, args) {
        const subArgs = args?.trim().split(/ (.+)/);
        const serverSetting = { ...settings.get(message.guild.id) };
        
        // if the user attempts to change a setting
        if (subArgs?.length >= 2) {
            
        }
        
        // if the user wants more info on a specific setting
        else if (subArgs?.length === 1) {
            if (settingsInfo[subArgs[0]]) {
                const settingInfoEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .addFields(
                        { name: `Setting: ${subArgs[0]}`, value: settingsInfo[subArgs[0]] + `\n**Current Value:** ${serverSetting[subArgs[0]]}` },
                    )
                return message.channel.send(settingInfoEmbed);
            } else {
                return message.reply(`That setting does not exist. Please note that settings are **case sensitive**! Use \`${serverSetting.prefix}settings\` for a list of settings.`);
            }
        }

        // if the user wants general settings info
        else {
            const keys = Object.keys(serverSetting);

            const blacklistedKeys = ["serverID", "_id"];
            if (!serverSetting.verificationEnabled) {
                blacklistedKeys.push('verificationProgram', 'verifiedRole', 'guestRole', 'autoGuest');
            }

            let settingsString = "";
            for (let key in keys) {
                if (!blacklistedKeys.includes(keys[key])) {
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