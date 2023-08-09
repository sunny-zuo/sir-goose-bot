import { Collection, Interaction } from 'discord.js';
import { EventHandler } from './eventHandler';
import Client from '#src/Client';
import { logger } from '#util/logger';
import ModalSubmitInteractionHandlers from '../interactions/modal';
import { ModalSubmitInteractionHandler } from '../interactions/modal/modalInteractionHandler';

export class ModalSubmitInteractionCreateEventHandler implements EventHandler {
    readonly eventName = 'interactionCreate';
    readonly client: Client;
    readonly modalSubmitInteractionHandlers = new Collection<string, ModalSubmitInteractionHandler>();

    constructor(client: Client) {
        this.client = client;
    }

    async execute(interaction: Interaction): Promise<void> {
        if (!interaction.isModalSubmit()) return;

        const client = this.client;

        for (const InteractionHandler of ModalSubmitInteractionHandlers) {
            const interactionHandler = new InteractionHandler(client);
            this.modalSubmitInteractionHandlers.set(interactionHandler.customId, interactionHandler);
        }

        const [interactionName] = interaction.customId.split('|');
        const handler = this.modalSubmitInteractionHandlers.get(interactionName);

        if (handler) {
            try {
                await handler.execute(interaction);
            } catch (e) {
                logger.error(e, e.message);
            }
        }

        logger.info(
            {
                modal: { customId: interaction.customId },
                guild: { id: interaction.guild?.id ?? 'none' },
                user: { id: interaction.user.id },
            },
            `Processing modal submission ${interaction.customId}`
        );
    }
}
