import { EventHandler } from './eventHandler';
import Client from '../Client';

export class ReadyEventHandler implements EventHandler {
    readonly eventName = 'ready';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(...args: any[]) {
        const client = this.client;
        client.log.info(`Client is now ready!`);

        // the user will never be null after the ready event is emitted
        client.log.info(`Logged in as ${client.user!.tag}`);
        client.user!.setActivity('$help');
    }
}
