import Discord, { ClientOptions } from 'discord.js';

export default class Client extends Discord.Client {
    constructor(options: ClientOptions) {
        super(options);
    }
}
