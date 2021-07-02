import { EventHandler } from './eventHandler';
import Client from '../Client';

export class ReadyEventHandler implements EventHandler {
    readonly eventName = 'ready';
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
