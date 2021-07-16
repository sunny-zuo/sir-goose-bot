import Client from '../../Client';
import { Command } from '../Command';
import GuildConfigModel from '../../models/guildConfig.model';
import { GuildConfigCache } from '../../helpers/guildConfigCache';
import { Message, CommandInteraction } from 'discord.js';

export class Reload extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'reload',
            description: 'Reloads all server configs and updates cache',
            ownerOnly: true,
            displayHelp: false,
        });
    }

    async execute(interaction: Message | CommandInteraction) {
        const configs = await GuildConfigModel.find({});

        for (const config of configs) {
            GuildConfigCache.updateCache(config);
        }

        interaction.reply({ content: 'All guild settings have been successfully reloaded!' });
    }
}
