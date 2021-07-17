import { ApplicationCommandOption, Collection, CommandInteraction, CommandInteractionOption, Message, MessageEmbed } from 'discord.js';
import Client from '../../Client';
import { GuildConfigCache } from '../../helpers/guildConfigCache';
import { Category } from '../../types/Command';
import { Command } from '../Command';

export class Help extends Command {
    private static options: ApplicationCommandOption[] = [
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
            examples: 'course',
        });
    }

    async execute(interaction: Message | CommandInteraction, args: Collection<string, CommandInteractionOption>) {
        const client = this.client;
        const prefix = (await GuildConfigCache.fetchConfig(interaction?.guild?.id)).prefix;

        if (args?.get('command')?.value !== undefined) {
            const commandQuery = args?.get('command')?.value as string;
            const command = client.commands.get(commandQuery.toLowerCase()) || client.aliases.get(commandQuery.toLowerCase());
            if (!command) {
                this.sendErrorEmbed(interaction, 'Command Not Found', `The command \`${commandQuery}\` was not found.`);
                return;
            }

            const embed = new MessageEmbed()
                .setTitle(`Command: \`${`${prefix}${commandQuery.toLowerCase()} ${this.listArguments(command)}`.trim()}\``)
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
                    { name: 'Example', value: `\`${`${prefix}${commandQuery.toLowerCase()} ${command.examples}`.trim()}\``, inline: true }
                )
                .setTimestamp();

            interaction.reply({ embeds: [embed] });
        } else {
            const categories: Category[] = [...new Set(client.commands.map((command) => command.category))].sort();

            const embed = new MessageEmbed()
                .setTitle('Command Help')
                .setDescription(
                    `In this server, the bot responds to the prefix \`${prefix}\`. You can also use slash commands!
                    For more info on a specific command, type \`${prefix}help (command)\``
                )
                .setColor('AQUA')
                .setTimestamp();

            for (const category of categories) {
                const categoryCommands = client.commands.filter((command) => command.category === category);
                embed.addField(`${category} Commands`, categoryCommands.map((command) => `\`${command.name}\``).join(' '), true);
            }

            interaction.reply({ embeds: [embed] });
        }
    }

    private listArguments(command: Command): string {
        let argString = '';
        for (const option of command.options) {
            let optionString = '';

            if (option.choices) {
                optionString = option.choices.map((choice) => choice.value).join('|');
            } else {
                switch (option.type) {
                    case 'CHANNEL':
                        optionString = 'channel';
                        break;
                    case 'ROLE':
                        optionString = 'role';
                        break;
                    case 'USER':
                        optionString = 'user';
                        break;
                    default:
                        optionString = option.name;
                }
            }

            if (option.required) argString += `(${optionString})`;
            else argString += `[${optionString}]`;
        }

        return argString;
    }
}
