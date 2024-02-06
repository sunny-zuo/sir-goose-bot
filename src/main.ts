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
    GatewayIntentBits.MessageContent,
];
const partials: Partials[] = [Partials.Channel, Partials.Message];
const client = new Client({ intents: intents, partials: partials });

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

init().catch((error) => console.error('Error initializing application.', { error }));
