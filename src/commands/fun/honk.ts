import { Command } from '../Command';
import Client from '../../Client';
import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import axios from 'axios';

const randomGoose = 'https://source.unsplash.com/random?goose,geese';

export class Honk extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'honk',
            description: 'HONK!',
        });
    }

    async execute(interaction: Message | CommandInteraction) {
        const channel = await this.getValidChannel(interaction.channel);

        if (Math.random() < 0.4) {
            const imageUrl = await axios.get(randomGoose).then((r) => r.request.res.responseUrl);
            const embed = new MessageEmbed().setColor('AQUA').setTitle('HONK HONK').setImage(imageUrl);

            channel.send({ embeds: [embed] });
        } else {
            channel.send({ content: 'HONK' });
        }
    }
}
