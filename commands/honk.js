module.exports = {
    name: 'honk',
    description: 'Honk!',
    args: false,
    guildOnly: false,
    execute(message) {
        message.channel.send('HONK');
    }
}