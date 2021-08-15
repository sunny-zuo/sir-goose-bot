import { ButtonInteractionCreateEventHandler } from './buttonInteractionCreateEventHandler';
import { CommandInteractionCreateEventHandler } from './commandInteractionCreateEventHandler';
import { GuildMemberAddEventHandler } from './guildMemberAddEventHandler';
import { MessageCreateEventHandler } from './messageCreateEventHandler';
import { ReadyEventHandler } from './readyEventHandler';
import { RoleDeleteEventHandler } from './roleDeleteEventHandler';
import { RoleUpdateEventHandler } from './roleUpdateEventHandler';

export default [
    GuildMemberAddEventHandler,
    ButtonInteractionCreateEventHandler,
    CommandInteractionCreateEventHandler,
    MessageCreateEventHandler,
    ReadyEventHandler,
    RoleDeleteEventHandler,
    RoleUpdateEventHandler,
];
