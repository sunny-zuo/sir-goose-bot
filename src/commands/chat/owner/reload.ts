import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
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

        // reload admin and guild configs
        await GuildConfigCache.reloadCache();
        await AdminConfigCache.reloadCache();

        await interaction.editReply({ content: 'All guild and admin settings have been successfully reloaded!' });
    }
}
