import Discord, { ClientOptions, Collection, User } from 'discord.js';
import { ChatCommand } from './commands/chat/ChatCommand';
import { Logger } from './helpers/logger';
import Events from './events';
import ChatCommands from './commands/chat';
import { WebApp } from './web/app';

export default class Client extends Discord.Client {
    chatCommands: Collection<string, ChatCommand>;
    chatAliases: Collection<string, ChatCommand>;
    webApp: WebApp;
    log: Logger;

    constructor(options: ClientOptions) {
        super(options);

        this.webApp = new WebApp(this);
        this.log = new Logger();

        this.chatCommands = new Collection<string, ChatCommand>();
        this.chatAliases = new Collection<string, ChatCommand>();

        this.loadEvents();
        this.loadCommands();
    }

    loadEvents(): void {
        for (const Event of Events) {
            try {
                const eventHandler = new Event(this);
                this.log.info(`Loading event ${eventHandler.eventName}`);

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                super.on(eventHandler.eventName, (...args) => eventHandler.execute(...args));
            } catch (e) {
                this.log.error(`Unable to load event: ${e}`, e.stack);
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
            } catch (e) {
                this.log.error(`Unable to load command: ${e}`, e.stack);
            }
        }
    }

    isOwner(user: User): boolean {
        return user.id === process.env.OWNER_ID;
    }
}
