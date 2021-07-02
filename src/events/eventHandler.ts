export interface EventHandler {
    readonly eventName: string;
    execute(...args: any[]): Promise<void>;
}
