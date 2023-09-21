import { ModalSubmitInteraction } from 'discord.js';
import Client from '#src/Client';

export interface ModalSubmitInteractionHandler {
    readonly client: Client;
    readonly customId: string;

    execute(interaction: ModalSubmitInteraction): Promise<void>;
}
