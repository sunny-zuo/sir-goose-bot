import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import axios from 'axios';
import { logger } from '#util/logger';

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
            logger.error(e, e.message);

            await interaction.reply({ content: 'We ran into an error fetching a random goose image. Please try again later.' });
        }
    }
}
