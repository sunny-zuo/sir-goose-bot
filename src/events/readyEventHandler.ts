import { EventHandler } from './eventHandler';
import Client from '#src/Client';

export class ReadyEventHandler implements EventHandler {
    readonly eventName = 'ready';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(): Promise<void> {
        const client = this.client;
        client.log.info(`Client is now ready!`);

        client.webApp.init();

        // the user will never be null after the ready event is emitted
        client.log.info(`Logged in as ${client.user!.tag}`);
        client.user!.setActivity('$help');
    }
}
