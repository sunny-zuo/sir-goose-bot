import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import GuildConfigModel from '#models/guildConfig.model';
import { GuildConfigCache } from '#util/guildConfigCache';
import { AdminConfigCache } from '#util/adminConfigCache';
import { ChatInputCommandInteraction } from 'discord.js';

export class Reload extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'reload',
            description: 'Reloads all configs from database and updates cache',
            category: 'Owner',
            ownerOnly: true,
            isSlashCommand: true,
            isTextCommand: false,
            displayHelp: false,
        });
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();

        // reload guild configs
        const configs = await GuildConfigModel.find({});
        for (const config of configs) {
            GuildConfigCache.updateCache(config);
        }

        // reload admin configs
        await AdminConfigCache.reloadCache();

        await interaction.editReply({ content: 'All guild settings have been successfully reloaded!' });
    }
}
