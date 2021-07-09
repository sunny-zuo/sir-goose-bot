import { Message } from 'discord.js';
import Client from '../Client';
import { InvalidCommandInteractionOption } from '../types';
import { EventHandler } from './eventHandler';

export class MessageCreateEventHandler implements EventHandler {
    readonly eventName = 'messageCreate';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(message: Message) {
        const prefix = '$'; // TODO: settings support for server specific prefixes
        if (!message.content.startsWith(prefix) || message.author.bot) return;

        const client = this.client;

        const messageContent = message.content.slice(prefix.length).replace(/\s+/g, ' ').trim().split(/ (.+)/);
        const commandName = messageContent.shift()?.toLowerCase();
        if (commandName === undefined) return;

        const command = client.commands.get(commandName) || client.aliases.get(commandName);
        if (!command || !command.enabled) return;
        if (!command.isMessageCommand) return;
        if (!command.checkCommandPermissions(message)) return;

        if (command.options.length > 0) {
            if (messageContent[0] === undefined || messageContent[0].length === 0) {
                // TODO: Send help message
                command.sendErrorEmbed(message, 'Missing Command Arguments', 'This command requires arguments.');
                return;
            }

            const argumentParser = await command.parseMessageArguments(message, messageContent[0]);

            if (argumentParser.success) {
                const args = argumentParser.value;

                client.log.command(
                    `${message.author.username} (${message.author.id}) ran command "${commandName}" with arguments in server ${
                        message?.guild?.name || 'DMs'
                    } (${message?.guild?.id || 'DMs'}) via message`
                );

                command.execute(message, args).catch((error) => {
                    client.log.error(error, error.stack);
                });
            } else {
                const invalidOption: InvalidCommandInteractionOption = argumentParser.error;
                // TODO: Give more descriptive error message & send help message
                command.sendErrorEmbed(message, 'Invalid Arguments Provided', `You provided an invalid argument for ${invalidOption.name}`);
            }
        } else {
            client.log.command(
                `${message.author.username} (${message.author.id}) ran command "${commandName}" without arguments in server ${
                    message?.guild?.name || 'DMs'
                } (${message?.guild?.id || 'DMs'}) via message`
            );

        command.execute(message, args).catch((error) => {
            client.log.error(error);
        });
    }
}
