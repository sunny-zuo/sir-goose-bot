import { Message, CommandInteraction, CommandInteractionOptionResolver } from 'discord.js';
import Client from '../../Client';
import { CommandOptions } from '../../types/Command';
import { Command } from '../Command';

export abstract class ChatCommand extends Command {
    constructor(client: Client, options: CommandOptions) {
        super(client, { ...options, isMessageCommand: false });
    }

    abstract execute(interaction: Message | CommandInteraction, args?: CommandInteractionOptionResolver): Promise<void>;
}
