import { ReadyEventHandler } from './readyEventHandler';
import { MessageCreateEventHandler } from './messageCreateEventHandler';
import { CommandInteractionCreateEventHandler } from './commandInteractionCreateEventHandler';
import { ButtonInteractionCreateEventHandler } from './buttonInteractionCreateEventHandler';

export default [ReadyEventHandler, MessageCreateEventHandler, CommandInteractionCreateEventHandler, ButtonInteractionCreateEventHandler];
