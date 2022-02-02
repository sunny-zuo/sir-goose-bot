import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import { CommandInteraction, Message, MessageEmbed, MessageOptions } from 'discord.js';
import axios from 'axios';

export class Honk extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'honk',
            description: 'HONK!',
            category: 'Fun',
            cooldownSeconds: 15,
            cooldownMaxUses: 10,
        });
    }

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        if (Math.random() < 0.4) {
            let response: MessageOptions = { content: 'HONK HONK' };
            try {
                const randomGoose = 'https://source.unsplash.com/random?goose,geese';
                const imageUrl = await axios.get(randomGoose).then((r) => r.request.res.responseUrl);
                response = { embeds: [new MessageEmbed().setColor('AQUA').setTitle('HONK HONK').setImage(imageUrl)] };
            } catch (e) {
                this.client.log.error(`Error querying unsplash API for goose image: ${e.message}`, e.stack);
            }

            await interaction.reply(response);
        } else {
            await interaction.reply({ content: 'HONK' });
        }
    }
}
