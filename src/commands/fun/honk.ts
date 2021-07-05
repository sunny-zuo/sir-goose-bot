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
            ownerOnly: true,
        });
    }

    async execute(interaction: Message | CommandInteraction) {
        if (Math.random() < 0.4) {
            const imageUrl = await axios.get(randomGoose).then((r) => r.request.res.responseUrl);
            const embed = new MessageEmbed().setColor('AQUA').setTitle('HONK HONK').setImage(imageUrl);

            interaction.reply({ embeds: [embed] }).catch((e) => this.client.log.error(e));
        } else {
            interaction.reply({ content: 'HONK' }).catch((e) => this.client.log.error(e));
        }
    }
}
