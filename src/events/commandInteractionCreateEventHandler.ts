import { Interaction, Permissions } from 'discord.js';
import { EventHandler } from './eventHandler';
import Client from '#src/Client';

export class CommandInteractionCreateEventHandler implements EventHandler {
    readonly eventName = 'interactionCreate';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(interaction: Interaction): Promise<void> {
        if (!interaction.isCommand()) return;

        const client = this.client;
        const command = client.chatCommands.get(interaction.commandName);
        const args = interaction.options;

        if (!command || !command.enabled) return;
        if (!command.isSlashCommand) return;
        if (interaction.guild && interaction.guild.available === false) return;
        if (command.isRateLimited(interaction.user.id)) {
            this.client.log.info(
                `${interaction.user.tag} tried to use ${command.name} in ${interaction.guild?.name ?? 'DMs'} (${
                    interaction.guild?.id ?? 'none'
                }) but was rate limited.`
            );

            await interaction.reply({
                content: `Slow down! You're using commands a bit too quickly; this command can only be used ${command.cooldownMaxUses} time(s) every ${command.cooldownSeconds} seconds.`,
                ephemeral: true,
            });
            return;
        }
        if (command.guildOnly && !interaction.guild) {
            await command.sendErrorEmbed(
                interaction,
                'Command is Server Only',
                'This command can only be used inside Discord servers and not DMs.'
            );
            return;
        }
        if (!(await command.checkCommandPermissions(interaction))) {
            if (
                interaction.channel &&
                interaction.channel.type === 'GUILD_TEXT' &&
                interaction.channel.guild.me &&
                !interaction.channel
                    .permissionsFor(interaction.channel.guild.me)
                    .has([Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS])
            ) {
                await interaction.user
                    .send({
                        content:
                            'I tried to respond to your command, but I do not have permission to view the channel, send messages and/or embed links in the channel the command was triggered in.',
                    })
                    .catch(() =>
                        client.log.info(
                            `${interaction.user.tag} has DMs closed and triggered a command in a channel (${interaction.channelId} in ${interaction.guildId}) I can't respond in.`
                        )
                    );
            }

            return;
        }

        client.log.command(
            `${interaction.user.tag} (${interaction.user.id}) ran command "${interaction.commandName}" in server ${
                interaction?.guild?.name || 'DMs'
            } (${interaction?.guild?.id || 'DMs'}) ${(args.data.length > 0 && `with arguments`) || 'without arguments'} via slash command`
        );

        command.execute(interaction, args).catch((error) => {
            client.log.error(
                `
                Command: ${command.name}
                Arguments: ${JSON.stringify(args.data, (key, value) => (typeof value === 'bigint' ? value.toString() : value))}
                Error: ${error}
                `,
                error.stack
            );
        });
    }
}
