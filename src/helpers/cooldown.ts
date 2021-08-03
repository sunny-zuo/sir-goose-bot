import { Collection, Snowflake } from 'discord.js';

export class Cooldown {
    readonly seconds: number;
    readonly cooldowns: Collection<Snowflake, number>;

    constructor(seconds: number) {
        this.seconds = seconds;
        this.cooldowns = new Collection<Snowflake, number>();
    }

    throttleSecondsRemaining(userId: Snowflake): number {
        if (this.cooldowns.has(userId)) {
            const cooldown = this.cooldowns.get(userId);
            if (cooldown && cooldown > Date.now()) {
                return Math.ceil((cooldown - Date.now()) / 1000);
            } else {
                this.cooldowns.set(userId, Date.now() + this.seconds * 1000);
                return 0;
            }
        } else {
            this.cooldowns.set(userId, Date.now() + this.seconds * 1000);
            return 0;
        }
    }
}
