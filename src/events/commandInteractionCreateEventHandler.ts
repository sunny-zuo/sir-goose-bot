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
        const args = interaction.options;

        if (!command || !command.enabled) return;
        if (!command.isSlashCommand) return;
        if (interaction.guild && !interaction.guild.available) return;
        if (command.guildOnly && !interaction.guild) {
            command.sendErrorEmbed(
                interaction,
                'Command is Server Only',
                'This command can only be used inside Discord servers and not DMs.'
            );
            return;
        }
        if (!command.checkCommandPermissions(interaction)) return;

        client.log.command(
            `${interaction.user.username} (${interaction.user.id}) ran command "${interaction.commandName}" in server ${
                interaction?.guild?.name || 'DMs'
            } (${interaction?.guild?.id || 'DMs'}) ${(args.size > 0 && `with arguments`) || 'without arguments'} via slash command`
        );

        command.execute(interaction, args).catch((error) => {
            client.log.error(error, error.stack);
        });
    }
}
