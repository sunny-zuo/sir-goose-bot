import { ApplicationCommandOptionType } from 'discord.js';

export const PRIVACY_POLICY_URL = 'https://app.notion.com/p/sir-goose/Privacy-Policy-3bd6b4c611c1808e8d38fcda84f9fc1a';
export const VERIFICATION_GUIDE_URL = 'https://sir-goose.notion.site/sir-goose/Setting-Up-Verification-0f309b2a00fc4e198b5f2182d2452fcd';

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
