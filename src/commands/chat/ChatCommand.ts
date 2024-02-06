import { Message, ChatInputCommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import Client from '#src/Client';
import { Category, ChatCommandOptions } from '#types/Command';
import { Command } from '../Command';

export abstract class ChatCommand extends Command {
    description: string;
    category: Category;
    isTextCommand: boolean;
    isSlashCommand: boolean;
    isContextMenuCommand = false;

    constructor(client: Client, options: ChatCommandOptions) {
        super(client, { ...options });

        this.description = options.description;
        this.category = options.category;
        this.isTextCommand = options.isTextCommand ?? true;
        this.isSlashCommand = options.isSlashCommand ?? true;
    }

    abstract execute(
        interaction: Message | ChatInputCommandInteraction,
        args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void>;
}
