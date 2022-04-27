import { EventHandler } from './eventHandler';
import Client from '#src/Client';
import { logger } from '#util/logger';
import { Guild } from 'discord.js';

export class GuildCreateEventHandler implements EventHandler {
    readonly eventName = 'guildCreate';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(guild: Guild): Promise<void> {
        let botInviter;

        try {
            const logs = await guild.fetchAuditLogs({ type: 'BOT_ADD', limit: 1 });
            const log = logs.entries.first();

            if (log && log.target && log.target.id === this.client.user?.id) {
                botInviter = log.executor;
            }
        } catch (e) {}

        logger.info({
            event: { name: this.eventName, guild: { id: guild.id, name: guild.name }, user: { id: botInviter?.id ?? 'unknown' } },
        });
    }
}
