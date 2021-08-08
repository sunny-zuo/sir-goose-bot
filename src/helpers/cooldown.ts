import { Collection, Snowflake } from 'discord.js';

type UserLimit = {
    uses: number;
    blockedUntil: number;
};

type RateLimited = {
    blocked: true;
    secondsUntilReset: number;
};

type NotRateLimited = {
    blocked: false;
};

export class Cooldown {
    readonly seconds: number;
    readonly maxUses: number;
    readonly cooldowns: Collection<Snowflake, UserLimit>;

    constructor(seconds: number, maxUses = 1) {
        this.seconds = seconds;
        this.maxUses = maxUses;
        this.cooldowns = new Collection<Snowflake, UserLimit>();
    }

    checkLimit(userId: Snowflake): RateLimited | NotRateLimited {
        const userLimit = this.cooldowns.get(userId) ?? { uses: 0, blockedUntil: 0 };

        if (userLimit.blockedUntil > Date.now()) {
            return {
                blocked: true,
                secondsUntilReset: Math.floor((userLimit.blockedUntil - Date.now()) / 1000),
            };
        } else {
            userLimit.uses++;

            if (userLimit.uses >= this.maxUses) {
                userLimit.uses = 0;
                userLimit.blockedUntil = Date.now() + this.seconds * 1000;

                setTimeout(() => {
                    this.cooldowns.delete(userId);
                }, this.seconds * 1000);
            }

            this.cooldowns.set(userId, userLimit);

            return {
                blocked: false,
            };
        }
    }
}
