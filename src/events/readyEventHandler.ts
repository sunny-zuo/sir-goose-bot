import { EventHandler } from './eventHandler';
import Client from '#src/Client';
import { logger } from '#util/logger';

export class ReadyEventHandler implements EventHandler {
    readonly eventName = 'ready';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async execute(): Promise<void> {
        const client = this.client;
        // the user will never be null after the ready event is emitted
        logger.info({ event: { name: this.eventName } }, `Client is now ready! Logged in as ${client.user!.tag}`);

        client.webApp.init();

        client.user!.setActivity('$help');
    }
}
