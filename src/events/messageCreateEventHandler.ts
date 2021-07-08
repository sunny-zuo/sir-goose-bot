import { Message } from 'discord.js';
import Client from '../Client';
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

        const messageContent = message.content.slice(prefix.length).trim().split(/ (.+)/);
        const commandName = messageContent.shift()?.toLowerCase();
        if (commandName === undefined) return;

        const command = client.commands.get(commandName) || client.aliases.get(commandName);
        if (!command || !command.enabled) return;

        const args = command.parseMessageArguments(messageContent[0]);

        if (!command.isMessageCommand) return;
        if (command.options.length > 0 && args.size === 0) return;
        if (!command.checkCommandPermissions(message)) return;

        client.log.command(
            `${message.author.username} (${message.author.id}) ran command "${commandName}" ${
                (args.size > 0 && `with arguments "${JSON.stringify(Array.from(args.entries()))}"`) ||
                'without arguments'
            } in server ${message?.guild?.name || 'DMs'} (${message?.guild?.id || 'DMs'}) via message`
        );

        command.execute(message, args).catch((error) => {
            client.log.error(error);
        });
    }
}
