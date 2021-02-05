const randomGoose = "https://source.unsplash.com/random?goose,geese";

module.exports = {
    name: 'honk',
    description: 'Honk!',
    args: false,
    guildOnly: false,
    displayHelp: true,
    execute(message) {
        if (Math.random() < 0.4) {
            message.channel.send('HONK HONK', { files: [randomGoose] });
        } else {
            message.channel.send('HONK');
        }
        
    }
}