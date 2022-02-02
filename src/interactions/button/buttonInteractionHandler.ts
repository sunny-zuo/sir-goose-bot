import { ButtonInteraction } from 'discord.js';
import Client from '#src/Client';
import { Cooldown } from '#util/cooldown';

export interface ButtonInteractionHandler {
    readonly client: Client;
    readonly customId: string;
    readonly cooldown: Cooldown;
    readonly limitMessage?: string;

    execute(interaction: ButtonInteraction, args?: string): Promise<void>;
}
