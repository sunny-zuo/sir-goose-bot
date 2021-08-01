import { ButtonInteraction } from 'discord.js';

export interface ButtonInteractionHandler {
    readonly customId: string;

    execute(interaction: ButtonInteraction): Promise<void>;
}
