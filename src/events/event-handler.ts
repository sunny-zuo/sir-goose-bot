export interface EventHandler {
    eventName: string;
    execute(...args: any[]): Promise<void>;
}
