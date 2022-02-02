import Discord, { ClientOptions, Collection, User } from 'discord.js';
import { ChatCommand } from './commands/chat/ChatCommand';
import { ContextMenuCommand } from './commands/contextMenu/ContextMenuCommand';
import { Logger } from '#util/logger';
import Events from './events';
import ChatCommands from './commands/chat';
import MessageCommands from './commands/contextMenu/message';
import { WebApp } from './web/app';

export default class Client extends Discord.Client {
    chatCommands: Collection<string, ChatCommand>;
    chatAliases: Collection<string, ChatCommand>;
    contextMenuCommands: Collection<string, ContextMenuCommand>;
    webApp: WebApp;
    log: Logger;

    constructor(options: ClientOptions) {
        super(options);

        this.webApp = new WebApp(this);
        this.log = new Logger();

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
                this.log.info(`Loading event ${eventHandler.eventName}`);

                // @ts-expect-error - since events have varying parameters, we just trust that the event handler has the correct types
                super.on(eventHandler.eventName, (...args) => eventHandler.execute(...args));
            } catch (e: unknown) {
                if (e instanceof Error) {
                    this.log.error(`Unable to load event: ${e}`, e.stack);
                } else {
                    this.log.error(`Unable to load event: ${e}`);
                }
            }
        }
    }

    loadCommands(): void {
        for (const ChatCommand of ChatCommands) {
            try {
                const command = new ChatCommand(this);
                this.log.info(`Loading chat command ${command.name}`);

                this.chatCommands.set(command.name, command);
                command.aliases.forEach((alias) => this.chatAliases.set(alias, command));
            } catch (e: unknown) {
                if (e instanceof Error) {
                    this.log.error(`Unable to load command: ${e}`, e.stack);
                } else {
                    this.log.error(`Unable to load command: ${e}`);
                }
            }
        }

        for (const MessageCommand of MessageCommands) {
            try {
                const command = new MessageCommand(this);
                this.log.info(`Loading message command ${command.name}`);

                this.contextMenuCommands.set(command.name, command);
            } catch (e: unknown) {
                if (e instanceof Error) {
                    this.log.error(`Unable to load command: ${e}`, e.stack);
                } else {
                    this.log.error(`Unable to load command: ${e}`);
                }
            }
        }
    }

    isOwner(user: User): boolean {
        return user.id === process.env.OWNER_ID;
    }
}
