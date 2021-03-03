const Discord = require('discord.js');
const settings = require('../settings.js');

module.exports = {
    name: 'pin',
    description: 'pins the referenced message used when invoking this command',
    args: false,
    guildOnly: true,
    displayHelp: false,
    permissions: ['MANAGE_MESSAGES'],
    execute(message) {
        var chnl = messages.channel;
        if (message.reference) {
            var referencedMessageID = message.reference.messageID;
            var referencedMessage;
            await chnl.messages.fetch(referencedMessageID).then(mmm => referencedMessage = mmm).catch(console.error);
            await referencedMessage.pin({ reason: 'goose bot pin command invoked' }).then(result => {
                Log.success(`Pin request success for Message: ${referencedMessage.content}`);
            }).catch(console.error)
            return;
        } else {
            chnl.send("No referenced message for pinning! Use the reply function to add a referenced message and try again.").then(sentMessage => {
                setTimeout(function () { sentMessage.delete(); }, 5000)
            })
        }
    }
}