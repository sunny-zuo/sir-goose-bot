import { ApplicationCommandOptionType } from 'discord.js';
import { ApplicationCommandOptionTypes } from 'discord.js/typings/enums';

export const enum Emojis {
    GreenCheck = '<:greenCheck:943012077524619344> ',
    RedCross = '<:redCross:943012077683998730>',
}

/* source: discord.js/typings/enums.d.ts */
export const ApplicationCommandOptionTypesStringMap: Record<ApplicationCommandOptionTypes, ApplicationCommandOptionType> = {
    1: 'SUB_COMMAND',
    2: 'SUB_COMMAND_GROUP',
    3: 'STRING',
    4: 'INTEGER',
    5: 'BOOLEAN',
    6: 'USER',
    7: 'CHANNEL',
    8: 'ROLE',
    9: 'MENTIONABLE',
    10: 'NUMBER',
    11: 'ATTACHMENT',
};
