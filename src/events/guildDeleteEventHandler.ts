import { EventHandler } from './eventHandler';
import Client from '#src/Client';
import { logger } from '#util/logger';
import { Guild } from 'discord.js';

export class GuildDeleteEventHandler implements EventHandler {
    readonly eventName = 'guildDelete';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async execute(guild: Guild): Promise<void> {
        logger.info({
            event: { name: this.eventName, guild: { id: guild.id, name: guild.name } },
        });
    }
}
