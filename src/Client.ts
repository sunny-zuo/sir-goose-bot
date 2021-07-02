import Discord, { ClientOptions, Collection } from 'discord.js';
import Events from './events';

export default class Client extends Discord.Client {
    constructor(options: ClientOptions) {
        super(options);

        this.loadEvents();
    }

    loadEvents(): void {
        for (const Event of Events) {
            const eventHandler = new Event(this);
            super.on(eventHandler.eventName, (...args) =>
                eventHandler.execute(...args)
            );
        }
    }
}
