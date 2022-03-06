import {
    ApplicationCommandData,
    ApplicationCommandOption,
    ApplicationCommandOptionData,
    CommandInteraction,
    CommandInteractionOptionResolver,
    Message,
} from 'discord.js';
import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import { logger } from '#util/logger';

export class Deploy extends ChatCommand {
    private static options: ApplicationCommandOption[] = [
        {
            name: 'guild',
            description: 'Deploy all commands in the current guild',
            type: 'SUB_COMMAND',
        },
        {
            name: 'global',
            description: 'Deploy all commands globally',
            type: 'SUB_COMMAND',
        },
    ];
    constructor(client: Client) {
        super(client, {
            name: 'deploy',
            description: 'Deploys application commands in current guild or globally',
            category: 'Owner',
            options: Deploy.options,
            isSlashCommand: false,
            isTextCommand: true,
            ownerOnly: true,
            displayHelp: false,
        });
    }

    async execute(
        interaction: Message | CommandInteraction,
        args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const client = this.client;
        const data: ApplicationCommandData[] = [];

        for (const [, command] of client.chatCommands) {
            if (command.isSlashCommand && !command.ownerOnly) {
                data.push({
                    name: command.name,
                    description: command.description,
                    /*
                        Type assertion here is not optimal, but ApplicationCommandOption is very similar to ApplicationCommandOptionData
                        and it's more convenient to use the former in the rest of the code at the moment
                    */
                    options: command.options as ApplicationCommandOptionData[],
                    type: 'CHAT_INPUT',
                });
            }
        }

        for (const [, command] of client.contextMenuCommands) {
            data.push({
                name: command.name,
                type: 'MESSAGE',
            });
        }

        if (args?.getSubcommand() === 'global') {
            const application = await client.application!.fetch();
            await application.commands.set(data);

            logger.info(`Loaded application commands globally`);
            await interaction.reply('Application commands have been loaded globally!');
        } else if (interaction.guild) {
            await interaction.guild.commands.set(data);

            logger.info(`Loaded application commands in guild ${interaction.guild.name}`);
            await interaction.reply('Application commands have been loaded in this guild!');
        } else {
            await interaction.reply("Can't deploy guild commands in DMs! Did you mean to deploy commands globally?");
        }
    }
}
