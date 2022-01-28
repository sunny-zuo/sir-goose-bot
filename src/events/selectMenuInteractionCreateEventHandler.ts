import { Interaction } from 'discord.js';
import { EventHandler } from './eventHandler';
import Client from '../Client';

export class SelectMenuInteractionCreateEventHandler implements EventHandler {
    readonly eventName = 'interactionCreate';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(interaction: Interaction): Promise<void> {
        if (!interaction.isSelectMenu()) return;

        this.client.log.info(
            `SELECT_MENU ${interaction.user.tag} (${interaction.user.id}) interacted with select menu with custom id ${
                interaction.customId
            } and selected ${JSON.stringify(interaction.values)} in ${interaction.guild?.name ?? 'DMs'} (${
                interaction.guild?.id ?? 'none'
            })`
        );
    }
}
