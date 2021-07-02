import { Message } from 'discord.js';
import { CommandOptions } from '../types/CommandOptions';
import Client from '../Client';

export abstract class Command {
    client: Client;
    name: string;
    description: string;
    aliases: Array<string> = [];
    args: boolean = false;
    guildOnly: boolean = false;
    ownerOnly: boolean = false;
    displayHelp: boolean = true;
    enabled: boolean = true;
    usage: string = '';
    examples: string = '';
    clientPermissions: Array<string> = ['SEND_MESSAGES', 'EMBED_LINKS'];
    userPermissions: Array<string> = [];

    constructor(client: Client, options: CommandOptions) {
        this.client = client;

        Object.keys(options).forEach(
            (key) => options[key] === undefined && delete options[key]
        );
        Object.assign(this, options);

        this.name = options.name;
        this.description = options.description;
    }

    abstract execute(message: Message, args: string): Promise<void>;
}
