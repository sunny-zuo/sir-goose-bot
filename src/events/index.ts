import { ButtonInteractionCreateEventHandler } from './buttonInteractionCreateEventHandler';
import { CommandInteractionCreateEventHandler } from './commandInteractionCreateEventHandler';
import { ContextMenuInteractionCreateEventHandler } from './contextMenuInteractionCreateEventHandler';
import { GuildMemberAddEventHandler } from './guildMemberAddEventHandler';
import { MessageCreateEventHandler } from './messageCreateEventHandler';
import { MessageDeleteBulkEventHandler } from './messageDeleteBulkEventHandler';
import { MessageDeleteEventHandler } from './messageDeleteEventHandler';
import { ReadyEventHandler } from './readyEventHandler';
import { RoleCreateEventHandler } from './roleCreateEventHandler';
import { RoleDeleteEventHandler } from './roleDeleteEventHandler';
import { RoleUpdateEventHandler } from './roleUpdateEventHandler';

export default [
    GuildMemberAddEventHandler,
    ButtonInteractionCreateEventHandler,
    CommandInteractionCreateEventHandler,
    ContextMenuInteractionCreateEventHandler,
    MessageCreateEventHandler,
    MessageDeleteBulkEventHandler,
    MessageDeleteEventHandler,
    ReadyEventHandler,
    RoleCreateEventHandler,
    RoleDeleteEventHandler,
    RoleUpdateEventHandler,
];
