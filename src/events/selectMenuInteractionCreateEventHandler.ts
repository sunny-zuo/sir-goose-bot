import { Interaction } from 'discord.js';
import { EventHandler } from './eventHandler';
import Client from '../Client';
import { logger } from '#util/logger';

export class SelectMenuInteractionCreateEventHandler implements EventHandler {
    readonly eventName = 'interactionCreate';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async execute(interaction: Interaction): Promise<void> {
        if (!interaction.isStringSelectMenu()) return;

        logger.info(
            {
                selectMenu: { customId: interaction.customId, values: interaction.values },
                guild: { id: interaction.guild?.id ?? 'none' },
                user: { id: interaction.user.id },
            },
            `Processing select menu interaction ${interaction.customId}`
        );
    }
}
