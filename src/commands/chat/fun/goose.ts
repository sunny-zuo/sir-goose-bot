import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import axios from 'axios';

export class Goose extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'goose',
            description: 'Get a random goose image!',
            category: 'Fun',
            aliases: ['geese'],
            cooldownSeconds: 10,
            cooldownMaxUses: 3,
        });
    }

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        try {
            const randomGoose = 'https://source.unsplash.com/random?goose,geese';
            const imageUrl = await axios.get(randomGoose).then((r) => r.request.res.responseUrl);
            const embed = new MessageEmbed().setColor('GREEN').setTitle('HONK HONK').setImage(imageUrl);

            await interaction.reply({ embeds: [embed] });
        } catch (e) {
            this.client.log.error(`Error querying unsplash API for goose image: ${e.message}`, e.stack);

            await interaction.reply({ content: 'We ran into an error fetching a random goose image. Please try again later.' });
        }
    }
}
