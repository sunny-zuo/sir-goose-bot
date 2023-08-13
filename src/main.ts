import 'dotenv/config';
import mongoose from 'mongoose';
import { Intents, PartialTypes } from 'discord.js';
import Client from './Client';
import { RoleAssignmentService } from './services/roleAssignmentService';
import { logger } from '#util/logger';
import { register, collectDefaultMetrics } from 'prom-client';

mongoose.set('strictQuery', false);

const intents = new Intents();
intents.add('GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS');

const partials: PartialTypes[] = ['CHANNEL', 'MESSAGE'];

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
