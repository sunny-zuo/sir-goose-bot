import { Command } from '../Command';
import Client from '../../Client';
import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import axios from 'axios';

export class Honk extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'honk',
            description: 'HONK!',
            category: 'Fun',
        });
    }

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        if (Math.random() < 0.4) {
            const randomGoose = 'https://source.unsplash.com/random?goose,geese';
            const imageUrl = await axios.get(randomGoose).then((r) => r.request.res.responseUrl);
            const embed = new MessageEmbed().setColor('AQUA').setTitle('HONK HONK').setImage(imageUrl);

            interaction.reply({ embeds: [embed] });
        } else {
            interaction.reply({ content: 'HONK' });
        }
    }
}
