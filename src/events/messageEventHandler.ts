import { Message } from 'discord.js';
import Client from '../Client';
import { EventHandler } from './eventHandler';

export class MessageEventHandler implements EventHandler {
    readonly eventName = 'message';
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(message: Message) {
        const prefix = '$'; // TODO: settings support for server specific prefixes
        if (!message.content.startsWith(prefix) || message.author.bot) return;

        const client = this.client;

        const args = message.content.slice(prefix.length).trim().split(/ (.+)/);
        const commandName = args.shift()?.toLowerCase();
        if (commandName === undefined) return;

        const command = client.commands.get(commandName) || client.aliases.get(commandName);

        if (!command || !command.enabled) return;
        if (command.args && args.length === 0) return;
        if (!command.checkMessageCommandPermissions(message)) return;

        command.execute(message, args[0]);
    }
}
