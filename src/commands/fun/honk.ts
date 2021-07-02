import { Command } from '../Command';
import Client from '../../Client';
import { Message, MessageEmbed } from 'discord.js';
import axios from 'axios';

const randomGoose = 'https://source.unsplash.com/random?goose,geese';

export class Honk extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'honk',
            description: 'HONK!',
        });
    }

    async execute(message: Message) {
        if (Math.random() < 0.4) {
            const imageUrl = await axios.get(randomGoose).then((r) => r.request.res.responseUrl);
            const embed = new MessageEmbed().setColor('AQUA').setTitle('HONK HONK').setImage(imageUrl);

            message.channel.send({ embeds: [embed] });
        } else {
            message.channel.send({ content: 'HONK' });
        }
    }
}
