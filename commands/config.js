const Discord = require('discord.js');
const settings = require('../settings.js');

const settingsInfo = {
    prefix: 'The prefix that the bot responds to in the server. It is `$` by default.',
    verificationEnabled: 'Set whether or not the bot should verify UW students and assign roles. Either `true` or `false`.',
    verificationProgram: 'The UW program to verify for, formatted the same way as shown on WatIAM. Example: `VPA/Software Engineering`',
    verifiedRole: 'The name of the role to assign if the user belongs to the specified verificationProgram',
    guestRole: 'The name of the role to assign if the user verifies as a UW student but is in a different program. Can be disabled by setting the autoGuest setting to false',
    autoGuest: 'Set whether or not the bot should assign the specified guestRole to users who are in a different program. Either `true` or `false`',
    enablePins: 'Set whether or not users without the manage messages permissions should be allowed to pin messages using the pin command'
}

function buildSettingListEmbed(message) {
    const serverSetting = { ...settings.get(message.guild.id) };
    const keys = Object.keys(serverSetting);

    const blacklistedKeys = ["serverID", "_id", "verificationRules", "verificationProgram", "verifiedRole", "guestRole", "autoGuest" ];

    let settingsString = "";
    for (let key in keys) {
        if (!blacklistedKeys.includes(keys[key])) {
            settingsString += `**${keys[key]}**: ${serverSetting[keys[key]]}\n`;
            if (keys[key] === "verificationEnabled") {
                settingsString += `**verificationRules**: View and edit with ${serverSetting.prefix}verifyrules\n`;
            }
        }
    }


    const settingListEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .addFields(
            { name: `__${message.guild.name} Settings__`, value: settingsString },
        )

    return settingListEmbed;
}

module.exports = {
    name: 'config',
    description: 'List the server\'s config and edit them',
    args: false,
    guildOnly: true,
    displayHelp: true,
    usage: "(setting) (new value)",
    permissions: ['MANAGE_GUILD'],
    async execute(message, args) {
        const subArgs = args?.trim().split(/ (.+)/);
        
        // if the user attempts to change a setting
        if (subArgs?.length >= 2) {
            const blacklistedKeys = ["serverID", "_id"];
            let serverSetting = { ...settings.get(message.guild.id) };
            if (serverSetting[subArgs[0]] !== undefined && !blacklistedKeys.includes(subArgs[0])) {
                if (typeof serverSetting[subArgs[0]] === "boolean") {
                    serverSetting[subArgs[0]] = (subArgs[1] == 'true');
                } else {
                    serverSetting[subArgs[0]] = subArgs[1];
                }
                await settings.set(message.guild.id, serverSetting);
                return message.channel.send({ content: 'Setting updated successfully. New settings:', embed: buildSettingListEmbed(message)})
            } else {
                return message.reply(`That setting does not exist. Please note that settings are **case sensitive**! Use \`${serverSetting.prefix}config\` for a list of settings.`);
            }
        }
        
        // if the user wants more info on a specific setting
        else if (subArgs?.length === 1) {
            const serverSetting = { ...settings.get(message.guild.id) };
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
            const settingListEmbed = buildSettingListEmbed(message);
            return message.channel.send(settingListEmbed);
        }
    }
}