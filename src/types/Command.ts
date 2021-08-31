import { ApplicationCommandOption } from 'discord.js';

export interface CommandOptions {
    name: string; // name of command, used to trigger command
    description?: string; // description of command shown in help message
    category?: Category; // category (used for help messages) used for command
    isSlashCommand?: boolean; // whether or not the command should be a slash command
    isTextCommand?: boolean; // whether or not the command should be a message (old-fashioned) command
    isContextMenuCommand?: boolean; // whether or not the command should be a message (context menu) command
    aliases?: string[]; // alternative ways of triggering command
    options?: ApplicationCommandOption[]; // arguments for a command
    guildOnly?: boolean; // if the command can only be used in guilds
    ownerOnly?: boolean; // if the command can only be used by the bot owner
    displayHelp?: boolean; // if the command should be displayed in the help message
    enabled?: boolean; // if the command is enabled
    examples?: string[]; // examples of how to use the command used in help message
    clientPermissions?: bigint[]; // bot permissions required to run command
    userPermissions?: bigint[]; // user permissions required to run command
    cooldownSeconds?: number; // cooldown duration for command per user
    cooldownMaxUses?: number; // maximum uses of the command per user until cooldown

    [key: string]: string | boolean | number | string[] | bigint[] | ApplicationCommandOption[] | undefined;
}

export interface ChatCommandOptions {
    name: string; // name of command, used to trigger command
    description: string; // description of command shown in help message
    category: Category; // category (used for help messages) used for command
    isSlashCommand?: boolean; // whether or not the command should be a slash command
    isTextCommand?: boolean; // whether or not the command should be a message (old-fashioned) command
    isContextMenuCommand?: false; // whether or not the command should be a message (context menu) command
    aliases?: string[]; // alternative ways of triggering command
    options?: ApplicationCommandOption[]; // arguments for a command
    guildOnly?: boolean; // if the command can only be used in guilds
    ownerOnly?: boolean; // if the command can only be used by the bot owner
    displayHelp?: boolean; // if the command should be displayed in the help message
    enabled?: boolean; // if the command is enabled
    examples?: string[]; // examples of how to use the command used in help message
    clientPermissions?: bigint[]; // bot permissions required to run command
    userPermissions?: bigint[]; // user permissions required to run command
    cooldownSeconds?: number; // cooldown duration for command per user
    cooldownMaxUses?: number; // maximum uses of the command per user until cooldown

    [key: string]: string | boolean | number | string[] | bigint[] | ApplicationCommandOption[] | undefined;
}

export interface ContextMenuCommandOptions {
    name: string; // name of command, used to trigger command
    isSlashCommand?: false; // whether or not the command should be a slash command
    isTextCommand?: false; // whether or not the command should be a message (old-fashioned) command
    isContextMenuCommand?: true; // whether or not the command should be a message (context menu) command
    guildOnly?: boolean; // if the command can only be used in guilds
    ownerOnly?: boolean; // if the command can only be used by the bot owner
    enabled?: boolean; // if the command is enabled
    clientPermissions?: bigint[]; // bot permissions required to run command
    userPermissions?: bigint[]; // user permissions required to run command
    cooldownSeconds?: number; // cooldown duration for command per user
    cooldownMaxUses?: number; // maximum uses of the command per user until cooldown

    [key: string]: string | boolean | number | string[] | bigint[] | ApplicationCommandOption[] | undefined;
}

export type Category =
    | 'Admin'
    | 'Fun'
    | 'General'
    | 'Info'
    | 'Message'
    | 'Moderation'
    | 'Owner'
    | 'User'
    | 'Utility'
    | 'UWaterloo'
    | 'Verification';
