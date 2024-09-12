import { Interaction, PermissionsBitField } from 'discord.js';
import { EventHandler } from './eventHandler';
import Client from '#src/Client';
import { logger } from '#util/logger';

export class ChatInputCommandInteractionCreateEventHandler implements EventHandler {
    readonly eventName = 'interactionCreate';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(interaction: Interaction): Promise<void> {
        if (!interaction.isChatInputCommand()) return;

        const client = this.client;
        const command = client.chatCommands.get(interaction.commandName);
        const args = interaction.options;

        if (!command || !command.enabled) return;
        if (!command.isSlashCommand) return;
        if (interaction.guild && interaction.guild.available === false) return;
        if (command.isRateLimited(interaction.user.id)) {
            logger.info(
                {
                    ratelimit: { type: 'command', name: command.name },
                    guild: { id: interaction.guild?.id ?? 'none' },
                    user: { id: interaction.user.id },
                },
                'User was ratelimited on a command interaction'
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
                !interaction.channel.isDMBased() &&
                interaction.channel.guild.members.me &&
                !interaction.channel
                    .permissionsFor(interaction.channel.guild.members.me)
                    .has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks])
            ) {
                await interaction.user
                    .send({
                        content:
                            'I tried to respond to your command, but I do not have permission to view the channel, send messages and/or embed links in the channel the command was triggered in.',
                    })
                    .catch(() => undefined);
            }

            return;
        }

        logger.info(
            {
                command: { name: command.name, source: 'slash' },
                guild: { id: interaction.guild?.id ?? 'none' },
                user: { id: interaction.user.id },
            },
            `Executing command interaction ${command.name}`
        );

        command.execute(interaction, args).catch((error) => {
            logger.error(error, error.message);
        });
    }
}
