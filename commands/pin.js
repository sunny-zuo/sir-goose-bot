const Discord = require('discord.js');
const settings = require('../settings.js');

module.exports = {
    name: 'pin',
    description: 'pins the referenced message used when invoking this command',
    args: false,
    guildOnly: true,
    displayHelp: true,
    permissions: ['MANAGE_MESSAGES'],
    execute(message) {
        if (message.reference) {
            var chnl = messages.channel;
            var referencedMessageID = message.reference.messageID;
            var referencedMessage;
            await chnl.messages.fetch(referencedMessageID).then(mmm => referencedMessage = mmm).catch(console.error);
            await referencedMessage.pin({ reason: 'goose bot pin command invoked' }).then(messages => {
                Log.success(`Pin request success for ${referencedMessage.content}`);
            }).catch(console.error)
            return;
        }
    }
}