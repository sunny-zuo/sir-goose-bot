import { Collection, Interaction } from 'discord.js';
import { EventHandler } from './eventHandler';
import ButtonInteractionHandlers from '../interactions/button';
import { ButtonInteractionHandler } from '../interactions/button/buttonInteractionHandler';
import Client from '../Client';

export class ButtonInteractionCreateEventHandler implements EventHandler {
    readonly eventName = 'interactionCreate';
    readonly client: Client;
    readonly buttonInteractionHandlers = new Collection<string, ButtonInteractionHandler>();

    constructor(client: Client) {
        this.client = client;

        for (const InteractionHandler of ButtonInteractionHandlers) {
            const interactionHandler = new InteractionHandler(client);
            this.buttonInteractionHandlers.set(interactionHandler.customId, interactionHandler);
        }
    }

    async execute(interaction: Interaction): Promise<void> {
        if (!interaction.isButton()) return;

        this.buttonInteractionHandlers.get(interaction.customId)?.execute(interaction);
    }
}
