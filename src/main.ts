import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Intents, PartialTypes } from 'discord.js';
import Client from './Client';
import { RoleAssignmentService } from './services/roleAssignmentService';

dotenv.config();

const intents = new Intents();
intents.add('GUILDS', 'GUILD_MEMBERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS');

const partials: PartialTypes[] = ['CHANNEL', 'MESSAGE'];

const client = new Client({ intents: intents, partials: partials });

async function init(): Promise<void> {
    await mongoose
        .connect(`${process.env.MONGO_URI}`)
        .then(() => {
            client.log.info('Successfully connected to MongoDB database');
        })
        .catch((e) => {
            client.log.error(`Failed to connect to MongoDB database: ${e}`);
        });

    RoleAssignmentService.parseCustomImports(client);

    await client.login(process.env.DISCORD_TOKEN);
}

init().catch((error) => console.error('Error initializing application.', { error }));
