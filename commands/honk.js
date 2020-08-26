module.exports = {
    name: 'honk',
    description: 'Honk!',
    args: false,
    guildOnly: false,
    displayHelp: true,
    execute(message) {
        message.channel.send('HONK');
    }
}