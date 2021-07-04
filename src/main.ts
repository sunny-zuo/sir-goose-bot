import dotenv from 'dotenv';
import { Intents, PartialTypes } from 'discord.js';

import Client from './Client';

dotenv.config();

const intents = new Intents();
intents.add(
    'GUILDS',
    'GUILD_MEMBERS',
    'GUILD_MESSAGES',
    'GUILD_MESSAGE_REACTIONS',
    'DIRECT_MESSAGES',
    'DIRECT_MESSAGE_REACTIONS'
);

const partials: Array<PartialTypes> = ['CHANNEL'];

const client = new Client({ intents: intents, partials: partials });

function init(): void {
    client.login(process.env.DISCORD_TOKEN);
}

init();
