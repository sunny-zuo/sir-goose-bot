import { ButtonInteraction } from 'discord.js';
import Client from '../../Client';

export interface ButtonInteractionHandler {
    readonly client: Client;
    readonly customId: string;

    execute(interaction: ButtonInteraction): Promise<void>;
}
