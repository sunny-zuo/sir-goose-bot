import Client from '../Client';

export interface EventHandler {
    readonly eventName: string;
    readonly client: Client;

    execute(...args: any[]): Promise<void>;
}
