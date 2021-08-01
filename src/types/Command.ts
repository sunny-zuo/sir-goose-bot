import { ApplicationCommandOption } from 'discord.js';

export interface CommandOptions {
    name: string; // name of command, used to trigger command
    description: string; // description of command shown in help message
    category: Category; // category (used for help messages) used for command
    isSlashCommand?: boolean; // whether or not the command should be a slash command
    isMessageCommand?: boolean; // whether or not the command should be a message (old-fashioned) command
    aliases?: string[]; // alternative ways of triggering command
    args?: boolean; // whether or not arguments are required
    options?: ApplicationCommandOption[]; // arguments for a command
    guildOnly?: boolean; // if the command can only be used in guilds
    ownerOnly?: boolean; // if the command can only be used by the bot owner
    displayHelp?: boolean; // if the command should be displayed in the help message
    enabled?: boolean; // if the command is enabled
    examples?: string[]; // examples of how to use the command used in help message
    clientPermissions?: bigint[]; // bot permissions required to run command
    userPermissions?: bigint[]; // user permissions required to run command

    [key: string]: string | boolean | string[] | bigint[] | ApplicationCommandOption[] | undefined;
}

export type Category = 'Admin' | 'Info' | 'Fun' | 'UWaterloo' | 'Utility' | 'Misc' | 'Owner' | 'Verification';
