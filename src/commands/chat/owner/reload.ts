import Client from '../../../Client';
import { ChatCommand } from '../ChatCommand';
import GuildConfigModel from '../../../models/guildConfig.model';
import { GuildConfigCache } from '../../../helpers/guildConfigCache';
import { Message, CommandInteraction } from 'discord.js';

export class Reload extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'reload',
            description: 'Reloads all server configs and updates cache',
            category: 'Owner',
            ownerOnly: true,
            displayHelp: false,
        });
    }

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        const configs = await GuildConfigModel.find({});

        for (const config of configs) {
            GuildConfigCache.updateCache(config);
        }

        await interaction.reply({ content: 'All guild settings have been successfully reloaded!' });
    }
}
