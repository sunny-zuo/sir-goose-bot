import { Message, MessageActionRow, MessageButton, MessageEmbed, Permissions } from 'discord.js';
import Client from '#src/Client';
import { InvalidCommandInteractionOption } from '../types';
import { EventHandler } from './eventHandler';
import { GuildConfigCache } from '#util/guildConfigCache';
import { Help } from '../commands/chat/info/help';
import { sendEphemeralReply } from '#util/message';

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
                const embed = new MessageEmbed()
                    .setTitle('Command Unavailable as Text Command')
                    .setColor('RED')
                    .setDescription(
                        `This command can only be used as a slash command (\`/${command.name}\`). If the slash command does not appear, you may need to grant the bot permissions to create slash commands.`
                    )
                    .setTimestamp();

                const button = new MessageActionRow().addComponents(
                    new MessageButton()
                        .setLabel('Grant Slash Command Permission')
                        .setStyle('LINK')
                        .setURL('https://discord.com/api/oauth2/authorize?client_id=740653704683716699&scope=applications.commands')
                );

                await message.reply({ embeds: [embed], components: [button] });
            }
            return;
        }
        if (message.guild && message.guild.available === false) return;
        if (command.isRateLimited(message.author.id)) {
            this.client.log.info(
                `${message.author.tag} tried to use ${command.name} in ${message.guild?.name ?? 'DMs'} (${
                    message.guild?.id ?? 'none'
                }) but was rate limited.`
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
                message.channel.type === 'GUILD_TEXT' &&
                message.channel.guild.me &&
                !message.channel
                    .permissionsFor(message.channel.guild.me)
                    .has([Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS])
            ) {
                await message.author
                    .send({
                        content:
                            'I tried to respond to your command, but I do not have permission to view the channel, send messages and/or embed links in the channel the command was triggered in.',
                    })
                    .catch(() =>
                        client.log.info(
                            `${message.author.tag} has DMs closed and triggered a command in a channel (${message.channelId} in ${message.guildId}) I can't respond in.`
                        )
                    );
            }

            return;
        }

        if (command.options.length > 0) {
            if (messageContent[0] === undefined || messageContent[0].length === 0) {
                if (
                    command.options[0].type === 'SUB_COMMAND' ||
                    command.options[0].type === 'SUB_COMMAND_GROUP' ||
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
                    client.log.command(
                        `${message.author.tag} (${message.author.id}) ran command "${commandName}" without arguments in server ${
                            message?.guild?.name || 'DMs'
                        } (${message?.guild?.id || 'DMs'}) via message`
                    );

                    command.execute(message).catch((error) => {
                        client.log.error(
                            `
                            Command: ${command.name}
                            Arguments: None
                            Error: ${error}
                            `,
                            error.stack
                        );
                    });
                    return;
                }
            }

            const argumentParser = await command.parseMessageArguments(message, messageContent[0]);

            if (argumentParser.success) {
                const args = argumentParser.value;

                client.log.command(
                    `${message.author.tag} (${message.author.id}) ran command "${commandName}" with arguments in server ${
                        message?.guild?.name || 'DMs'
                    } (${message?.guild?.id || 'DMs'}) via message`
                );

                command.execute(message, args).catch((error) => {
                    client.log.error(
                        `
                        Command: ${command.name}
                        Arguments: ${JSON.stringify(args.data, (key, value) => (typeof value === 'bigint' ? value.toString() : value))}
                        Error: ${error}
                        `,
                        error.stack
                    );
                });
            } else {
                const invalidOption: InvalidCommandInteractionOption = argumentParser.error;
                await command.sendErrorEmbed(
                    message,
                    'Invalid Arguments Provided',
                    `You provided an invalid argument for \`${
                        invalidOption.name
                    }\`, which needs to be a \`${invalidOption.type.toLowerCase()}\`.
                    
                    Command Usage: \`${`${prefix}${commandName} ${Help.listArguments(command)}`.trim()}\``
                );
            }
        } else {
            client.log.command(
                `${message.author.tag} (${message.author.id}) ran command "${commandName}" without arguments in server ${
                    message?.guild?.name || 'DMs'
                } (${message?.guild?.id || 'DMs'}) via message`
            );

            command.execute(message).catch((error) => {
                client.log.error(
                    `
                    Command: ${command.name}
                    Arguments: None
                    Error: ${error}
                    `,
                    error.stack
                );
            });
        }
    }
}
