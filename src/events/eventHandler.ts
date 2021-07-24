import Client from '../Client';

export interface EventHandler {
    readonly eventName: string;
    readonly client: Client;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execute(...args: any[]): Promise<void>;
}
