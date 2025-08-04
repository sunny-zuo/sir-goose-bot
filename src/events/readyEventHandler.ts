import { EventHandler } from './eventHandler';
import Client from '#src/Client';
import { logger } from '#util/logger';
import { Gauge, register } from 'prom-client';
import express from 'express';
import { ActivityType } from 'discord.js';

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

        client.user!.setActivity('for /help', { type: ActivityType.Watching });

        // check if admin commands are deployed in the specified ADMIN_GUILD_ID and deploy them
        // if not; this prevents being stuck in a scenario where there is no way to deploy commands
        if (process.env.ADMIN_GUILD_ID) {
            const adminGuild = client.guilds.cache.get(process.env.ADMIN_GUILD_ID);
            if (adminGuild) {
                const existingCommands = await adminGuild.commands.fetch();

                if (!existingCommands.map((c) => c.name).includes('deploy')) {
                    await client.deployOwnerOnlyCommands(adminGuild);
                } else {
                    logger.info({ event: { name: this.eventName } }, `Skipping owner-only command deployment, commands already deployed`);
                }
            } else {
                logger.warn({ event: { name: this.eventName } }, `Admin guild with ID ${process.env.ADMIN_GUILD_ID} not found!`);
            }
        }

        const prom_app = express();
        prom_app.get('/metrics', async (req, res) => {
            res.set('Content-Type', register.contentType);
            res.end(await register.metrics());
        });
        prom_app.listen(8080, () => {
            logger.info({ event: { name: this.eventName } }, 'Prometheus metrics server listening on port 8080');
        });

        new Gauge({
            name: 'sir_goose_bot_guilds_total',
            help: 'Total number of guilds',
            collect() {
                this.set(client.guilds.cache.size);
            },
        });

        new Gauge({
            name: 'sir_goose_bot_members_total',
            help: 'Total number of users',
            labelNames: ['guildId', 'guildName'],
            collect() {
                for (const guild of client.guilds.cache.values()) {
                    this.set({ guildId: guild.id, guildName: guild.name }, guild.memberCount);
                }
            },
        });

        new Gauge({
            name: 'sir_goose_bot_channels_total',
            help: 'Total number of channels',
            collect() {
                this.set(client.channels.cache.size);
            },
        });

        new Gauge({
            name: 'sir_goose_bot_ws_ping',
            help: 'Websocket ping',
            collect() {
                this.set(client.ws.ping);
            },
        });
    }
}
