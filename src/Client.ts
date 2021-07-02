import Discord, { ClientOptions, Collection, User } from 'discord.js';
import { Command } from './commands/Command';
import Events from './events';
import Commands from './commands';

export default class Client extends Discord.Client {
    commands: Collection<string, Command>;
    aliases: Collection<string, Command>;

    constructor(options: ClientOptions) {
        super(options);
        this.commands = new Collection<string, Command>();
        this.aliases = new Collection<string, Command>();

        this.loadEvents();
        this.loadCommands();
    }

    loadEvents(): void {
        for (const Event of Events) {
            const eventHandler = new Event(this);
            // @ts-ignore
            super.on(eventHandler.eventName, (...args) => eventHandler.execute(...args));
        }
    }

    loadCommands(): void {
        for (const Command of Commands) {
            const command = new Command(this);

            this.commands.set(command.name, command);
            command.aliases.forEach((alias) => this.aliases.set(alias, command));
        }
    }

    isOwner(user: User): boolean {
        return user.id === process.env.OWNER_ID;
    }
}
