import { EventHandler } from './event-handler';
import Client from '../Client';

export class ReadyHandler implements EventHandler {
    eventName = 'ready';
    client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(...args: any[]) {
        const client = this.client;

        // the user will never be null after the ready event is emitted
        console.log(`Logged in as ${client.user!.tag}`);
        client.user!.setActivity('$help');
    }
}
