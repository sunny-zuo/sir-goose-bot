import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Intents, PartialTypes } from 'discord.js';

import Client from './Client';

dotenv.config();

const intents = new Intents();
intents.add('GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS');

const partials: Array<PartialTypes> = ['CHANNEL'];

const client = new Client({ intents: intents, partials: partials });

async function init(): Promise<void> {
    await mongoose
        .connect(`${process.env.MONGO_URI}`, {
            useNewUrlParser: true,
            useFindAndModify: false,
            useCreateIndex: true,
            useUnifiedTopology: true,
        })
        .then(() => {
            client.log.info('Successfully connected to MongoDB database');
        })
        .catch((e) => {
            client.log.error(`Failed to connect to MongoDB database: ${e}`);
        });

    client.login(process.env.DISCORD_TOKEN);
}

init();
