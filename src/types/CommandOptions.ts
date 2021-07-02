export interface CommandOptions {
    name: string; // name of command, used to trigger command
    description: string; // description of command shown in help message
    aliases?: Array<string>; // alternative ways of triggering command
    args?: boolean; // whether or not arguments are required
    guildOnly?: boolean; // if the command can only be used in guilds
    ownerOnly?: boolean; // if the command can only be used by the bot owner
    displayHelp?: boolean; // if the command should be displayed in the help message
    enabled?: boolean; // if the command is enabled
    usage?: string; // arguments required to use the command used in help message
    examples?: string; // examples of how to use the command used in help message
    clientPermissions?: Array<string>; // bot permissions required to run command
    userPermissions?: Array<string>; // user permissions required to run command

    [key: string]: string | boolean | Array<string> | undefined;
}
