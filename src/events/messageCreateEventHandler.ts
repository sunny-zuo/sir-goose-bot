import {
    Message,
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    ButtonStyle,
    PermissionsBitField,
    ChannelType,
    ApplicationCommandOptionType,
} from 'discord.js';
import Client from '#src/Client';
import { InvalidCommandInteractionOption } from '../types';
import { EventHandler } from './eventHandler';
import { GuildConfigCache } from '#util/guildConfigCache';
import { Help } from '../commands/chat/info/help';
import { sendEphemeralReply } from '#util/message';
import { logger } from '#util/logger';
import { ApplicationCommandOptionTypeToString } from '#util/constants';

export class MessageCreateEventHandler implements EventHandler {
    readonly eventName = 'messageCreate';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(message: Message): Promise<void> {
        if (message.partial) {
            message = await message.fetch();
        }

        const prefix = (await GuildConfigCache.fetchConfig(message.guild?.id)).prefix;
        if (!message.content.startsWith(prefix) || message.author.bot) return;

        const client = this.client;

        const messageContent = message.content.slice(prefix.length).replace(/\s+/g, ' ').trim().split(/ (.+)/);
        const commandName = messageContent.shift()?.toLowerCase();
        if (commandName === undefined) return;

        const command = client.chatCommands.get(commandName) || client.chatAliases.get(commandName);
        if (!command || !command.enabled) return;
        if (!command.isTextCommand) {
            if (command.isSlashCommand) {
                const embed = new EmbedBuilder()
                    .setTitle('Command Unavailable as Text Command')
                    .setColor('Red')
                    .setDescription(
                        `This command can only be used as a slash command (\`/${command.name}\`). If the slash command does not appear, you may need to grant the bot permissions to create slash commands.`
                    )
                    .setTimestamp();

                const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setLabel('Grant Slash Command Permission')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://discord.com/api/oauth2/authorize?client_id=740653704683716699&scope=applications.commands')
                );

                await message.reply({ embeds: [embed], components: [button] });
            }
            return;
        }
        if (message.guild && message.guild.available === false) return;
        if (command.isRateLimited(message.author.id)) {
            logger.info(
                {
                    ratelimit: { type: 'command', name: command.name },
                    guild: { id: message.guild?.id ?? 'none' },
                    user: { id: message.author.id },
                },
                'User was ratelimited on a message command interaction'
            );

            return sendEphemeralReply(
                message,
                {
                    content: `Slow down! You're using commands a bit too quickly; this command can only be used ${command.cooldownMaxUses} time(s) every ${command.cooldownSeconds} seconds.`,
                },
                15
            );
        }
        if (command.guildOnly && !message.guild) {
            await command.sendErrorEmbed(
                message,
                'Command is Server Only',
                'This command can only be used inside Discord servers and not DMs.'
            );
            return;
        }
        if (!(await command.checkCommandPermissions(message))) {
            if (
                message.channel.type === ChannelType.GuildText &&
                message.channel.guild.members.me &&
                !message.channel
                    .permissionsFor(message.channel.guild.members.me)
                    .has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks])
            ) {
                await message.author
                    .send({
                        content:
                            'I tried to respond to your command, but I do not have permission to view the channel, send messages and/or embed links in the channel the command was triggered in.',
                    })
                    .catch(() => undefined);
            }

            return;
        }

        if (command.options.length > 0) {
            if (messageContent[0] === undefined || messageContent[0].length === 0) {
                if (
                    command.options[0].type === ApplicationCommandOptionType.Subcommand ||
                    command.options[0].type === ApplicationCommandOptionType.SubcommandGroup ||
                    command.options[0].required
                ) {
                    await command.sendErrorEmbed(
                        message,
                        'Missing Command Arguments',
                        `This command requires arguments.
                        Usage: \`${`${prefix}${commandName} ${Help.listArguments(command)}`.trim()}\`
                        
                        Type \`${prefix}help ${commandName}\` for more info.`
                    );
                    return;
                } else {
                    logger.info(
                        {
                            command: { name: command.name, source: 'message' },
                            guild: { id: message.guild?.id ?? 'none' },
                            user: { id: message.author.id },
                        },
                        `Executing command message interaction ${command.name}`
                    );

                    command.execute(message).catch((error) => {
                        logger.error(error, error.message);
                    });
                    return;
                }
            }

            const argumentParser = await command.parseMessageArguments(message, messageContent[0]);

            if (argumentParser.success) {
                const args = argumentParser.value;

                logger.info(
                    {
                        command: { name: command.name, source: 'message' },
                        guild: { id: message.guild?.id ?? 'none' },
                        user: { id: message.author.id },
                    },
                    `Executing command message interaction ${command.name}`
                );

                command.execute(message, args).catch((error) => {
                    logger.error(error, error.message);
                });
            } else {
                const invalidOption: InvalidCommandInteractionOption = argumentParser.error;
                await command.sendErrorEmbed(
                    message,
                    'Invalid Arguments Provided',
                    `You provided an invalid argument for \`${
                        invalidOption.name
                    }\`, which needs to be a \`${ApplicationCommandOptionTypeToString.get(invalidOption.type)}\`.
                    
                    Command Usage: \`${`${prefix}${commandName} ${Help.listArguments(command)}`.trim()}\``
                );
            }
        } else {
            logger.info(
                {
                    command: { name: command.name, source: 'message' },
                    guild: { id: message.guild?.id ?? 'none' },
                    user: { id: message.author.id },
                },
                `Executing command message interaction ${command.name}`
            );

            command.execute(message).catch((error) => {
                logger.error(error, error.message);
            });
        }
    }
}
