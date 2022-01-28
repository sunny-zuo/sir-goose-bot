import { ButtonInteractionCreateEventHandler } from './buttonInteractionCreateEventHandler';
import { CommandInteractionCreateEventHandler } from './commandInteractionCreateEventHandler';
import { ContextMenuInteractionCreateEventHandler } from './contextMenuInteractionCreateEventHandler';
import { GuildMemberAddEventHandler } from './guildMemberAddEventHandler';
import { MessageCreateEventHandler } from './messageCreateEventHandler';
import { MessageDeleteBulkEventHandler } from './messageDeleteBulkEventHandler';
import { MessageDeleteEventHandler } from './messageDeleteEventHandler';
import { ReadyEventHandler } from './readyEventHandler';
import { SelectMenuInteractionCreateEventHandler } from './selectMenuInteractionCreateEventHandler';
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
    SelectMenuInteractionCreateEventHandler,
    RoleCreateEventHandler,
    RoleDeleteEventHandler,
    RoleUpdateEventHandler,
];
