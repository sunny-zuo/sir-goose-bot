import { EmbedBuilder, Interaction, PermissionsBitField } from 'discord.js';
import { EventHandler } from './eventHandler';
import Client from '#src/Client';
import { logger } from '#util/logger';

export class ChatInputCommandInteractionCreateEventHandler implements EventHandler {
    readonly eventName = 'interactionCreate';
    readonly client: Client;
    readonly unknownErrorEmbed = new EmbedBuilder()
        .setDescription(
            'An unexpected error occured. Please try again or ask for help in the [support server](https://discord.gg/KHByMmrrw2).'
        )
        .setColor('Red');

    constructor(client: Client) {
        this.client = client;
    }

    async execute(interaction: Interaction): Promise<void> {
        if (!interaction.isChatInputCommand()) return;

        const logInfo = {
            command: { name: interaction.commandName, source: 'slash' },
            guild: { id: interaction.guild?.id ?? 'none' },
            user: { id: interaction.user.id },
        };

        logger.info(logInfo, 'Received chat input command interaction');

        const client = this.client;
        const command = client.chatCommands.get(interaction.commandName);
        const args = interaction.options;

        if (!command || !command.enabled) {
            await interaction.reply({ embeds: [this.unknownErrorEmbed], ephemeral: true });
            return logger.warn(logInfo, 'Received interaction for unknown or disabled command');
        }
        if (!command.isSlashCommand) {
            await interaction.reply({ embeds: [this.unknownErrorEmbed], ephemeral: true });
            return logger.warn(logInfo, 'Received interaction for non-slash command');
        }
        if (interaction.guild && interaction.guild.available === false) {
            await interaction.reply({ embeds: [this.unknownErrorEmbed], ephemeral: true });
            return logger.warn(logInfo, 'Received interaction for command in unavailable guild');
        }
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
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `Slow down! You're using commands a bit too quickly; this command can only be used ${command.cooldownMaxUses} time(s) every ${command.cooldownSeconds} seconds.`
                        )
                        .setColor('Yellow'),
                ],
                ephemeral: true,
            });
            return;
        }
        if (command.guildOnly && !interaction.guild) {
            logger.warn(logInfo, 'Received interaction for command that is server only in DMs');
            await interaction.reply({
                embeds: [new EmbedBuilder().setDescription('This command can only be used inside Discord servers.').setColor('Red')],
            });
            return;
        }
        // TODO: refactor how responses work here, `checkCommandPermissions` should not be sending messages itself
        // and should probably just return a boolean or an error message that can be sent later
        if (!(await command.checkCommandPermissions(interaction))) {
            if (
                interaction.channel &&
                !interaction.channel.isDMBased() &&
                interaction.channel.guild.members.me &&
                !interaction.channel
                    .permissionsFor(interaction.channel.guild.members.me)
                    .has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks])
            ) {
                logger.debug(logInfo, 'Bot lacks permissions to send permission error message in channel');
                await interaction.user
                    .send({
                        content:
                            'I tried to respond to your command, but I do not have permission to view the channel, send messages and/or embed links in the channel the command was triggered in.',
                    })
                    .catch((e) => logger.warn({ ...logInfo, error: e }, 'Failed to send DM to user about missing permissions'));
            } else {
                logger.debug(logInfo, 'Exiting command execution due to failed permission check');
            }

            return;
        }

        logger.info(logInfo, `Executing command interaction ${interaction.commandName}`);

        command.execute(interaction, args).catch((error) => {
            logger.error(error, error.message);
        });
    }
}
