import 'dotenv/config';
import mongoose from 'mongoose';
import { GatewayIntentBits, Partials } from 'discord.js';
import Client from './Client';
import { RoleAssignmentService } from './services/roleAssignmentService';
import { logger } from '#util/logger';
import { register, collectDefaultMetrics } from 'prom-client';

mongoose.set('strictQuery', false);

const intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
];
const partials: Partials[] = [Partials.Channel, Partials.Message];
const client = new Client({ intents: intents, partials: partials });

const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS ?? 8000);

async function init(): Promise<void> {
    register.setDefaultLabels({ app: 'sir-goose-bot' });
    collectDefaultMetrics({ register, prefix: 'sir_goose_bot_' });

    await mongoose
        .connect(`${process.env.MONGO_URI}`)
        .then(() => {
            logger.info('Successfully connected to MongoDB database');
        })
        .catch((e) => {
            logger.error(e, e.message);
        });

    RoleAssignmentService.parseCustomImports();

    await client.login(process.env.DISCORD_TOKEN);
}

async function shutdown(signal: NodeJS.Signals): Promise<void> {
    let isShuttingDown = false;

    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info({ signal }, 'Shutting down');

    const cleanup = Promise.all([client.destroy(), mongoose.disconnect()]);
    const timeout = new Promise<never>((_, reject) => {
        const timeoutId = setTimeout(() => reject(new Error('Timed out waiting for connections to close')), SHUTDOWN_TIMEOUT_MS);
        timeoutId.unref();
    });

    try {
        await Promise.race([cleanup, timeout]);
    } catch (e) {
        logger.warn(e, 'Shutdown did not finish cleanly');
    }

    process.exit(0);
}

process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));

init().catch((error) => {
    logger.error(error, 'Error initializing application.');
    process.exit(1);
});
