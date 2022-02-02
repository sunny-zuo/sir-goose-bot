import { ContextMenuInteraction } from 'discord.js';
import Client from '#src/Client';
import { ContextMenuCommandOptions } from '#types/Command';
import { Command } from '../Command';

export abstract class ContextMenuCommand extends Command {
    isSlashCommand = false;
    isTextCommand = false;
    isContextMenuCommand = true;

    constructor(client: Client, options: ContextMenuCommandOptions) {
        super(client, { ...options });
    }

    abstract execute(interaction: ContextMenuInteraction): Promise<void>;
}
