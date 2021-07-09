import { CommandInteractionOption, DMChannel, NewsChannel, PartialDMChannel, TextChannel, ThreadChannel } from 'discord.js';

export type TextBasedChannel = TextChannel | DMChannel | NewsChannel | PartialDMChannel | ThreadChannel;
export type GuildTextBasedChannel = TextChannel | NewsChannel | ThreadChannel;

export type Result<TResult, TError> = ResultSuccess<TResult> | ResultError<TError>;
export type ResultSuccess<TResult> = { success: true; value: TResult };
export type ResultError<TError> = { success: false; error: TError };

export interface InvalidCommandInteractionOption extends CommandInteractionOption {
    issue: ArgumentIssue;
}

export enum ArgumentIssue {
    MISSING,
    INVALID_TYPE,
    INVALD_CHOICE,
}
