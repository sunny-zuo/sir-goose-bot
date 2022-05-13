import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import { CommandInteraction, Message, MessageEmbed, InteractionReplyOptions, ReplyMessageOptions } from 'discord.js';
import axios from 'axios';
import { logger } from '#util/logger';

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
            let response: InteractionReplyOptions & ReplyMessageOptions = { content: 'HONK HONK' };
            try {
                const randomGoose = 'https://source.unsplash.com/random?goose,geese';
                const imageUrl = await axios.get(randomGoose).then((r) => r.request.res.responseUrl);
                response = { embeds: [new MessageEmbed().setColor('AQUA').setTitle('HONK HONK').setImage(imageUrl)] };
            } catch (e) {
                logger.error(e, e.message);
            }

            await interaction.reply(response);
        } else {
            await interaction.reply({ content: 'HONK' });
        }
    }
}
