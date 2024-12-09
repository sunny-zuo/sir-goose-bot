import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { logger } from '#util/logger';
import { fetchGooseImage } from './goose';

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

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();

        let gooseImageEmbed: EmbedBuilder | undefined;
        if (Math.random() < 0.4) {
            try {
                const gooseImage = await fetchGooseImage();
                gooseImageEmbed = new EmbedBuilder()
                    .setColor('Aqua')
                    .setTitle('HONK HONK')
                    .setImage(gooseImage.urls.small)
                    .setFooter({ text: `Photo by ${gooseImage.user.name} on Unsplash` });
            } catch (e) {
                logger.error(e, e.message);
            }
        }

        if (gooseImageEmbed) {
            await interaction.editReply({ embeds: [gooseImageEmbed] });
        } else {
            await interaction.editReply({ content: 'HONK' });
        }
    }
}
