import { ReadyEventHandler } from './readyEventHandler';
import { MessageCreateEventHandler } from './messageCreateEventHandler';
import { CommandInteractionCreateEventHandler } from './commandInteractionCreateEventHandler';

export default [ReadyEventHandler, MessageCreateEventHandler, CommandInteractionCreateEventHandler];
