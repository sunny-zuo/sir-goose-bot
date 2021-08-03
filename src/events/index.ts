import { ButtonInteractionCreateEventHandler } from './buttonInteractionCreateEventHandler';
import { CommandInteractionCreateEventHandler } from './commandInteractionCreateEventHandler';
import { GuildMemberAddEventHandler } from './guildMemberAddEventHandler';
import { MessageCreateEventHandler } from './messageCreateEventHandler';
import { ReadyEventHandler } from './readyEventHandler';

export default [
    GuildMemberAddEventHandler,
    ButtonInteractionCreateEventHandler,
    CommandInteractionCreateEventHandler,
    MessageCreateEventHandler,
    ReadyEventHandler,
];
