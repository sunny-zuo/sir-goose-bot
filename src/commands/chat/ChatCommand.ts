import { Message, CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import Client from '../../Client';
import { Category, ChatCommandOptions } from '../../types/Command';
import { Command } from '../Command';

export abstract class ChatCommand extends Command {
    description: string;
    category: Category;
    isTextCommand = true;
    isSlashCommand = true;
    isContextMenuCommand = false;

    constructor(client: Client, options: ChatCommandOptions) {
        super(client, { ...options });

        this.description = options.description;
        this.category = options.category;
    }

    abstract execute(
        interaction: Message | CommandInteraction,
        args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void>;
}
