import {
    ApplicationCommandOption,
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
    Message,
    EmbedBuilder,
    ApplicationCommandOptionType,
    codeBlock,
    inlineCode,
} from 'discord.js';
import Client from '#src/Client';
import { GuildConfigCache } from '#util/guildConfigCache';
import { Category } from '#types/Command';
import { ChatCommand } from '../ChatCommand';

export class Help extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'command',
            description: 'The name of the specific command you want to learn more about',
            type: ApplicationCommandOptionType.String,
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
        interaction: Message | ChatInputCommandInteraction,
        args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const client = this.client;

        const commandQuery = args?.getString('command');
        if (commandQuery) {
            const command = client.chatCommands.get(commandQuery.toLowerCase()) || client.chatAliases.get(commandQuery.toLowerCase());
            if (!command) {
                await this.sendErrorEmbed(interaction, 'Command Not Found', `The command \`${commandQuery}\` was not found.`);
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`Command: \`${`/${commandQuery.toLowerCase()}${Help.listArguments(command)}`.trim()}\``)
                .setColor('Aqua')
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
                                ? command.examples.map((example) => `\`/${commandQuery.toLowerCase()} ${example}\``).join('\n')
                                : `\`/${commandQuery.toLowerCase()}\``,
                        inline: true,
                    }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } else {
            const categories: Category[] = [...new Set(client.chatCommands.map((command) => command.category))].sort();

            const embed = new EmbedBuilder()
                .setTitle('Command Help')
                .setDescription(
                    `You can use slash commands to interact with me! Simply type \`/\` in the chat box followed by the command name.
                    For more info on a specific command, use \`/help (command name)\`.`
                )
                .setColor('Aqua')
                .setTimestamp();

            for (const category of categories) {
                const categoryCommands = client.chatCommands.filter((command) => command.category === category && command.displayHelp);

                if (categoryCommands.size > 0) {
                    embed.addFields([
                        {
                            name: `${category} Commands`,
                            value: categoryCommands.map((command) => `\`${command.name}\``).join(' '),
                            inline: true,
                        },
                    ]);
                }
            }

            embed.addFields({
                name: 'Verification Guide',
                value: 'Looking to setup verification for your server? [Check out the guide!](https://sir-goose.notion.site/sir-goose/Setting-Up-Verification-0f309b2a00fc4e198b5f2182d2452fcd)',
            });

            await interaction.reply({ embeds: [embed] });
        }
    }

    static listArguments(command: ChatCommand): string {
        let argString = '';

        for (const option of command.options) {
            let optionString = '';

            if (option.type === ApplicationCommandOptionType.Subcommand || option.type === ApplicationCommandOptionType.SubcommandGroup) {
                // TODO: refactor help command to display subcommands properly
                return '';
            } else if (
                (option.type === ApplicationCommandOptionType.String ||
                    option.type === ApplicationCommandOptionType.Integer ||
                    option.type === ApplicationCommandOptionType.Number) &&
                !option.autocomplete &&
                option.choices
            ) {
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
