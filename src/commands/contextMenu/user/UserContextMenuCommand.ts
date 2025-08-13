import { UserContextMenuCommandInteraction } from 'discord.js';
import Client from '#src/Client';
import { ContextMenuCommandOptions } from '#types/Command';
import { Command } from '../../Command';

export abstract class UserContextMenuCommand extends Command {
    isSlashCommand = false;
    isTextCommand = false;
    isUserContextMenuCommand = true;

    constructor(client: Client, options: ContextMenuCommandOptions) {
        super(client, { ...options });
    }

    abstract execute(interaction: UserContextMenuCommandInteraction): Promise<void>;
}
