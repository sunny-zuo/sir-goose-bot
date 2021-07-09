import Discord, { ClientOptions, Collection, User } from 'discord.js';
import { Command } from './commands/Command';
import { Logger } from './helpers/logger';
import Events from './events';
import Commands from './commands';

export default class Client extends Discord.Client {
    commands: Collection<string, Command>;
    aliases: Collection<string, Command>;
    log: Logger;

    constructor(options: ClientOptions) {
        super(options);

        this.log = new Logger();

        this.commands = new Collection<string, Command>();
        this.aliases = new Collection<string, Command>();

        this.loadEvents();
        this.loadCommands();
    }

    loadEvents(): void {
        for (const Event of Events) {
            try {
                const eventHandler = new Event(this);
                this.log.info(`Loading event ${eventHandler.eventName}`);

                // @ts-ignore
                super.on(eventHandler.eventName, (...args) => eventHandler.execute(...args));
            } catch (e) {
                this.log.error(`Unable to load event: ${e}`, e.stack);
            }
        }
    }

    loadCommands(): void {
        for (const Command of Commands) {
            try {
                const command = new Command(this);
                this.log.info(`Loading command ${command.name}`);

                this.commands.set(command.name, command);
                command.aliases.forEach((alias) => this.aliases.set(alias, command));
            } catch (e) {
                this.log.error(`Unable to load command: ${e}`, e.stack);
            }
        }
    }

    isOwner(user: User): boolean {
        return user.id === process.env.OWNER_ID;
    }
}
