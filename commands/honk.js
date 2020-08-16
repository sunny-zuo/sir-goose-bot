module.exports = {
    name: 'honk',
    description: 'Honk!',
    execute(message) {
        message.channel.send('HONK');
    }
}