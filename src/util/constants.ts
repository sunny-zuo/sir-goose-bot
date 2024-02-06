import { ApplicationCommandOptionType } from 'discord.js';

export const enum Emojis {
    GreenCheck = '<:greenCheck:943012077524619344> ',
    RedCross = '<:redCross:943012077683998730>',
}

export const ApplicationCommandOptionTypeToString: Map<ApplicationCommandOptionType, string> = new Map<
    ApplicationCommandOptionType,
    string
>([
    [ApplicationCommandOptionType.Subcommand, 'Subcommand'],
    [ApplicationCommandOptionType.SubcommandGroup, 'Subcommand'],
    [ApplicationCommandOptionType.String, 'String'],
    [ApplicationCommandOptionType.Integer, 'Integer'],
    [ApplicationCommandOptionType.Boolean, 'Boolean'],
    [ApplicationCommandOptionType.User, 'User'],
    [ApplicationCommandOptionType.Channel, 'Channel'],
    [ApplicationCommandOptionType.Role, 'Role'],
    [ApplicationCommandOptionType.Mentionable, 'Mentionable'],
    [ApplicationCommandOptionType.Number, 'Number'],
    [ApplicationCommandOptionType.Attachment, 'Attachment'],
]);
