import { ApplicationCommandOption, CommandInteraction, CommandInteractionOptionResolver, Message, MessageEmbed } from 'discord.js';
import Client from '#src/Client';
import { GuildConfigCache } from '#util/guildConfigCache';
import { Category } from '#types/Command';
import { ChatCommand } from '../ChatCommand';

export class Help extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'command',
            description: 'The name of the specific command you want to learn more about',
            type: 'STRING',
            required: false,
        },
    ];

    constructor(client: Client) {
        super(client, {
            name: 'help',
            description: 'List all commands or learn more about a specific command',
            category: 'Info',
            options: Help.options,
            examples: ['course'],
            cooldownSeconds: 2,
        });
    }

    async execute(
        interaction: Message | CommandInteraction,
        args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const client = this.client;
        const prefix = (await GuildConfigCache.fetchConfig(interaction?.guild?.id)).prefix;

        const commandQuery = args?.getString('command');
        if (commandQuery) {
            const command = client.chatCommands.get(commandQuery.toLowerCase()) || client.chatAliases.get(commandQuery.toLowerCase());
            if (!command) {
                await this.sendErrorEmbed(interaction, 'Command Not Found', `The command \`${commandQuery}\` was not found.`);
                return;
            }

            const embed = new MessageEmbed()
                .setTitle(`Command: \`${`${prefix}${commandQuery.toLowerCase()}${Help.listArguments(command)}`.trim()}\``)
                .setColor('AQUA')
                .addFields(
                    { name: 'Description', value: command.description },
                    {
                        name: 'Aliases',
                        value: [command.name]
                            .concat(command.aliases)
                            .map((alias) => `\`${alias}\``)
                            .join(' '),
                        inline: true,
                    },
                    {
                        name: 'Examples',
                        value:
                            command.examples.length > 0
                                ? command.examples.map((example) => `\`${prefix}${commandQuery.toLowerCase()} ${example}\``).join('\n')
                                : `\`${prefix}${commandQuery.toLowerCase()}\``,
                        inline: true,
                    }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } else {
            const categories: Category[] = [...new Set(client.chatCommands.map((command) => command.category))].sort();

            const embed = new MessageEmbed()
                .setTitle('Command Help')
                .setDescription(
                    `In this server, the bot responds to the prefix \`${prefix}\`. You can also use slash commands!
                    For more info on a specific command, type \`${prefix}help (command)\``
                )
                .setColor('AQUA')
                .setTimestamp();

            for (const category of categories) {
                const categoryCommands = client.chatCommands.filter((command) => command.category === category && command.displayHelp);

                if (categoryCommands.size > 0) {
                    embed.addField(`${category} Commands`, categoryCommands.map((command) => `\`${command.name}\``).join(' '), true);
                }
            }

            await interaction.reply({ embeds: [embed] });
        }
    }

    static listArguments(command: ChatCommand): string {
        let argString = '';

        for (const option of command.options) {
            let optionString = '';

            if (option.type === 'SUB_COMMAND' || option.type === 'SUB_COMMAND_GROUP') {
                // TODO: refactor help command to display subcommands properly
                return '';
            } else if ((option.type === 'STRING' || option.type === 'INTEGER' || option.type === 'NUMBER') && option.choices) {
                optionString = option.choices.map((choice) => choice.value).join('|');
            } else {
                optionString = option.name;
            }

            if (option.required) argString += ` (${optionString})`;
            else argString += ` [${optionString}]`;
        }

        return argString;
    }
}
