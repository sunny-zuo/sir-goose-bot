import {
    ApplicationCommandData,
    ApplicationCommandOption,
    ApplicationCommandOptionData,
    ApplicationCommandOptionType,
    ApplicationCommandType,
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
} from 'discord.js';
import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import { logger } from '#util/logger';

export class Deploy extends ChatCommand {
    private static options: ApplicationCommandOption[] = [
        {
            name: 'guild',
            description: 'Deploy all commands in the current guild',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'global',
            description: 'Deploy all commands globally',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'owner',
            description: 'Deploy owner-only commands',
            type: ApplicationCommandOptionType.Subcommand,
        },
    ];
    constructor(client: Client) {
        super(client, {
            name: 'deploy',
            description: 'Deploys application commands in current guild or globally',
            category: 'Owner',
            options: Deploy.options,
            isSlashCommand: true,
            isTextCommand: false,
            ownerOnly: true,
            displayHelp: false,
        });
    }

    async execute(
        interaction: ChatInputCommandInteraction,
        args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        await interaction.deferReply();

        const client = this.client;
        const option = args.getSubcommand();

        switch (option) {
            case 'global': {
                const commandData = [...this.getChatCommandData(client), ...this.getMessageContextCommandData(client)];
                const application = await client.application!.fetch();
                await application.commands.set(commandData);

                logger.info(`Loaded application commands globally`);
                await interaction.editReply('Application commands have been loaded globally!');
                break;
            }
            case 'guild': {
                if (interaction.guild) {
                    const commandData = [...this.getChatCommandData(client), ...this.getMessageContextCommandData(client)];
                    await interaction.guild.commands.set(commandData);

                    logger.info(`Loaded application commands in guild ${interaction.guild.name}`);
                    await interaction.editReply('Application commands have been loaded in this guild!');
                } else {
                    await interaction.editReply("Can't deploy guild commands in DMs! Did you mean to deploy commands globally?");
                }
                break;
            }
            case 'owner': {
                const adminGuildId = process.env.ADMIN_GUILD_ID;
                if (!adminGuildId) {
                    await interaction.editReply('ADMIN_GUILD_ID not set, skipping owner-only command deployment');
                    return;
                }

                const adminGuild = await client.guilds.fetch(adminGuildId);
                if (!adminGuild) {
                    await interaction.editReply(`Admin guild with ID ${adminGuildId} not found, skipping owner-only command deployment`);
                    return;
                }

                await client.deployOwnerOnlyCommands(adminGuild);
                await interaction.editReply('Owner-only commands have been loaded!');
                break;
            }
        }
    }

    getChatCommandData(client: Client): ApplicationCommandData[] {
        const data: ApplicationCommandData[] = [];

        for (const [, command] of client.chatCommands) {
            if (command.isSlashCommand && !command.ownerOnly) {
                data.push({
                    name: command.name,
                    description: command.description,
                    /*
                        Type assertion here is not optimal, but ApplicationCommandOption is very similar to ApplicationCommandOptionData
                        and it's more convenient to use the former in the rest of the code at the moment
                        TODO: stop relying on this
                    */
                    options: command.options as ApplicationCommandOptionData[],
                    type: ApplicationCommandType.ChatInput,
                });
            }
        }

        return data;
    }

    getMessageContextCommandData(client: Client): ApplicationCommandData[] {
        const data: ApplicationCommandData[] = [];

        for (const [, command] of client.messageContextMenuCommands) {
            data.push({
                name: command.name,
                type: ApplicationCommandType.Message,
            });
        }

        return data;
    }
}
