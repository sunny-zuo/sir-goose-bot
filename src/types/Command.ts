import { ApplicationCommandOption } from 'discord.js';

export interface CommandOptions {
    name: string; // name of command, used to trigger command
    description: string; // description of command shown in help message
    category: Category; // category (used for help messages) used for command
    isSlashCommand?: boolean; // whether or not the command should be a slash command
    isMessageCommand?: boolean; // whether or not the command should be a message (old-fashioned) command
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

export type Category = 'Admin' | 'Fun' | 'General' | 'Info' | 'Moderation' | 'Owner' | 'Utility' | 'UWaterloo' | 'Verification';
