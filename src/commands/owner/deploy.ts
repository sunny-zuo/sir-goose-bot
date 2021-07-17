import { ApplicationCommandData, CommandInteraction, Message } from 'discord.js';
import Client from '../../Client';
import { Command } from '../Command';

export class Deploy extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'deploy',
            description: 'Deploys slash commands in current guild, meant for testing',
            category: 'Owner',
            isSlashCommand: false,
            isMessageCommand: true,
            guildOnly: true,
            ownerOnly: true,
            displayHelp: false,
        });
    }

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        const client = this.client;
        const data: ApplicationCommandData[] = [];

        for (const [_, command] of client.commands) {
            if (command.isSlashCommand) {
                data.push({
                    name: command.name,
                    description: command.description,
                    options: command.options,
                });
            }
        }

        await interaction.guild!.commands.set(data);
        client.log.info(`Loaded slash commands in guild ${interaction.guild!.name}`);
        interaction.reply('Slash commands have been loaded in this guild!').catch((e) => this.client.log.error(e));
    }
}
