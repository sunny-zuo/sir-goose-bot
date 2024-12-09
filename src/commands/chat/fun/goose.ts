import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { logger } from '#util/logger';

type PartialUnsplashPhotoResponse = {
    urls: {
        small: string;
    };
    user: {
        name: string;
    };
};

const gooseApi = 'https://api.unsplash.com/photos/random?query=goose';

class Goose extends ChatCommand {
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

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();

        try {
            const gooseImage = await fetchGooseImage();
            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('HONK HONK')
                .setImage(gooseImage.urls.small)
                .setFooter({ text: `Photo by ${gooseImage.user.name} on Unsplash` });

            await interaction.editReply({ embeds: [embed] });
        } catch (e) {
            logger.error(e, e.message);

            await interaction.editReply({ content: 'We ran into an error fetching a random goose image. Please try again later :(' });
        }
    }
}

async function fetchGooseImage(): Promise<PartialUnsplashPhotoResponse> {
    return axios
        .get<PartialUnsplashPhotoResponse>(gooseApi, {
            headers: {
                Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
                'Accept-Version': 'v1',
            },
        })
        .then((r) => r.data);
}

export { Goose, fetchGooseImage };
