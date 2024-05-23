import { ButtonInteractionCreateEventHandler } from './buttonInteractionCreateEventHandler';
import { ChatInputCommandInteractionCreateEventHandler } from './chatInputCommandInteractionCreateEventHandler';
import { MessageContextMenuCommandInteractionCreateEventHandler } from './contextMenuInteractionCreateEventHandler';
import { GuildCreateEventHandler } from './guildCreateEventHandler';
import { GuildDeleteEventHandler } from './guildDeleteEventHandler';
import { GuildMemberAddEventHandler } from './guildMemberAddEventHandler';
import { MessageCreateEventHandler } from './messageCreateEventHandler';
import { MessageDeleteBulkEventHandler } from './messageDeleteBulkEventHandler';
import { MessageDeleteEventHandler } from './messageDeleteEventHandler';
import { ReadyEventHandler } from './readyEventHandler';
import { SelectMenuInteractionCreateEventHandler } from './selectMenuInteractionCreateEventHandler';
import { RoleCreateEventHandler } from './roleCreateEventHandler';
import { RoleDeleteEventHandler } from './roleDeleteEventHandler';
import { RoleUpdateEventHandler } from './roleUpdateEventHandler';
import { ModalSubmitInteractionCreateEventHandler } from './modalSubmitInteractionCreateEventHandler';

export default [
    GuildMemberAddEventHandler,
    ButtonInteractionCreateEventHandler,
    ChatInputCommandInteractionCreateEventHandler,
    MessageContextMenuCommandInteractionCreateEventHandler,
    GuildCreateEventHandler,
    GuildDeleteEventHandler,
    MessageCreateEventHandler,
    MessageDeleteBulkEventHandler,
    MessageDeleteEventHandler,
    ReadyEventHandler,
    SelectMenuInteractionCreateEventHandler,
    RoleCreateEventHandler,
    RoleDeleteEventHandler,
    RoleUpdateEventHandler,
    ModalSubmitInteractionCreateEventHandler,
];
