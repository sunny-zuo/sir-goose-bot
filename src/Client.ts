import Discord, { ClientOptions, Collection, User } from 'discord.js';
import { ChatCommand } from './commands/chat/ChatCommand';
import { ContextMenuCommand } from './commands/contextMenu/ContextMenuCommand';
import Events from './events';
import ChatCommands from './commands/chat';
import MessageCommands from './commands/contextMenu/message';
import { logger } from '#util/logger';
import { WebApp } from './web/app';

export default class Client extends Discord.Client {
    chatCommands: Collection<string, ChatCommand>;
    chatAliases: Collection<string, ChatCommand>;
    contextMenuCommands: Collection<string, ContextMenuCommand>;
    webApp: WebApp;

    constructor(options: ClientOptions) {
        super(options);

        this.webApp = new WebApp(this);

        this.chatCommands = new Collection<string, ChatCommand>();
        this.chatAliases = new Collection<string, ChatCommand>();
        this.contextMenuCommands = new Collection<string, ContextMenuCommand>();

        this.loadEvents();
        this.loadCommands();
    }

    loadEvents(): void {
        for (const Event of Events) {
            try {
                const eventHandler = new Event(this);
                logger.info({ event: { name: eventHandler.eventName } }, `Registering event: ${eventHandler.eventName}`);

                super.on(eventHandler.eventName, async (...args) => {
                    try {
                        // @ts-expect-error - since events have varying parameters, we just trust that the event handler has the correct types
                        await eventHandler.execute(...args);
                    } catch (e) {
                        logger.error(e, e.message);
                    }
                });
            } catch (e) {
                logger.error(e, e.message);
            }
        }
    }

    loadCommands(): void {
        for (const ChatCommand of ChatCommands) {
            try {
                const command = new ChatCommand(this);
                logger.info({ event: { name: command.name } }, `Registering chat command: ${command.name}`);

                this.chatCommands.set(command.name, command);
                command.aliases.forEach((alias) => this.chatAliases.set(alias, command));
            } catch (e) {
                logger.error(e, e.message);
            }
        }

        for (const MessageCommand of MessageCommands) {
            try {
                const command = new MessageCommand(this);
                logger.info({ event: { name: command.name } }, `Registering message command: ${command.name}`);

                this.contextMenuCommands.set(command.name, command);
            } catch (e) {
                logger.error(e, e.message);
            }
        }
    }

    isOwner(user: User): boolean {
        return user.id === process.env.OWNER_ID;
    }
}
