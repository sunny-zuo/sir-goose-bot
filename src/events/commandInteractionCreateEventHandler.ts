import { Interaction } from 'discord.js';
import { EventHandler } from './eventHandler';
import Client from '../Client';

export class CommandInteractionCreateEventHandler implements EventHandler {
    readonly eventName = 'interactionCreate';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(interaction: Interaction) {
        if (!interaction.isCommand()) return;

        const client = this.client;
        const command = client.commands.get(interaction.commandName);

        if (!command || !command.enabled) return;
        if (!command.isSlashCommand) return;
        if (!command.checkCommandPermissions(interaction)) return;

        client.log.command(
            `${interaction.user.username} (${interaction.user.id}) ran command "${interaction.commandName}" in server ${
                interaction?.guild?.name || 'DMs'
            } (${interaction?.guild?.id || 'DMs'}) via slash command`
        );

        // TODO: Build proper option/argument handling
        command.execute(interaction, '').catch((error) => {
            client.log.error(error);
        });
    }
}
