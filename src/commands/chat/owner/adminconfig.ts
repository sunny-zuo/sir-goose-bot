import {
    ApplicationCommandOption,
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
    EmbedBuilder,
    inlineCode,
} from 'discord.js';
import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import { AdminConfigCache } from '#util/adminConfigCache';
import { logger } from '#util/logger';

export class AdminConfig extends ChatCommand {
    private static options: ApplicationCommandOption[] = [
        {
            name: 'view',
            description: 'Display all current admin configuration flags',
            type: ApplicationCommandOptionType.Subcommand,
        },
        {
            name: 'set',
            description: 'Create or update an admin configuration flag',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'key',
                    description: 'The configuration key to set',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: 'value',
                    description: 'The configuration value to set',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: 'comment',
                    description: 'Optional comment describing this configuration',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
            ],
        },
        {
            name: 'delete',
            description: 'Remove an admin configuration flag',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'key',
                    description: 'The configuration key to delete',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
    ];

    constructor(client: Client) {
        super(client, {
            name: 'adminconfig',
            description: 'Manage admin configuration flags',
            category: 'Owner',
            options: AdminConfig.options,
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

        const subcommand = args.getSubcommand();
        try {
            switch (subcommand) {
                case 'view':
                    await this.handleView(interaction);
                    break;
                case 'set':
                    await this.handleSet(interaction, args);
                    break;
                case 'delete':
                    await this.handleDelete(interaction, args);
                    break;
                default:
                    await interaction.editReply({ content: 'Unknown subcommand.' });
                    logger.warn(`Unknown subcommand ${subcommand} for adminconfig command`);
            }
        } catch (error) {
            logger.error(error, `Error executing adminconfig ${subcommand} command`);
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';

            await interaction.followUp({
                embeds: [new EmbedBuilder().setColor('Red').setDescription(`Unexpected Error: ${errorMessage}`)],
                ephemeral: true,
            });
        }
    }

    private async handleView(interaction: ChatInputCommandInteraction): Promise<void> {
        const configs = await AdminConfigCache.getAllConfigs();
        const configKeys = Object.keys(configs);

        if (configKeys.length === 0) {
            const embed = new EmbedBuilder().setDescription('No admin config flags are currently set.').setColor('Yellow').setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('Admin Configuration Flags')
            .setColor('Blue')
            .setTimestamp()
            .setFooter({ text: `${configKeys.length} config flag${configKeys.length === 1 ? '' : 's'} found` });

        configKeys.sort(); // sort keys alphabetically for consistent display

        for (const key of configKeys) {
            const config = configs[key];
            const fieldValue = [
                `Value: \`${config.value}\``,
                config.comment ? `Comment: *${config.comment}*` : null,
                `Updated: <t:${Math.floor(config.updatedAt.getTime() / 1000)}:R>`,
            ]
                .filter(Boolean)
                .join('\n');

            embed.addFields({ name: key, value: fieldValue, inline: false });
        }

        await interaction.editReply({ embeds: [embed] });
    }

    private async handleSet(
        interaction: ChatInputCommandInteraction,
        args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const key = args.getString('key', true);
        const value = args.getString('value', true);
        const comment = args.getString('comment', false);

        // validate key format (alphanumeric, underscores, hyphens)
        if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(
                            `The key ${inlineCode(
                                key
                            )} is invalid. Configuration key must contain only alphanumeric characters, underscores, and hyphens.`
                        )
                        .setColor('Red'),
                ],
            });
            return;
        }

        // check if this is an update or new config
        const configs = await AdminConfigCache.getAllConfigs();
        const { value: prevValue, comment: prevComment } = configs[key] ?? {};
        const isUpdate = prevValue !== undefined;

        await AdminConfigCache.setConfig(key, value, comment ?? prevComment);
        logger.info({
            configUpdate: {
                message: `Admin config ${isUpdate ? 'updated' : 'created'}: ${key} = ${value} ${comment ? `(${comment})` : ''}`,
                key,
                value,
                comment,
                prevValue,
            },
            user: interaction.user.id,
        });

        const embed = new EmbedBuilder()
            .setTitle(`Configuration ${isUpdate ? 'Updated' : 'Created'}`)
            .setColor(isUpdate ? 'DarkGreen' : 'Green')
            .setTimestamp()
            .addFields(
                { name: 'Key', value: `\`${key}\``, inline: true },
                { name: 'Value', value: `\`${value}\``, inline: true },
                { name: 'Action', value: isUpdate ? 'Updated' : 'Created', inline: true }
            );

        if (comment) {
            embed.addFields({ name: 'Comment', value: comment, inline: false });
        }
        if (isUpdate && prevValue !== value) {
            embed.addFields({ name: 'Previous Value', value: `\`${prevValue}\``, inline: false });
        }

        await interaction.editReply({ embeds: [embed] });
    }

    private async handleDelete(
        interaction: ChatInputCommandInteraction,
        args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const key = args.getString('key', true);

        // first, check if the config exists
        const existingValue = await AdminConfigCache.getConfig(key);
        if (existingValue === null) {
            await interaction.editReply({
                embeds: [new EmbedBuilder().setDescription(`Configuration key \`${key}\` does not exist.`).setColor('Red')],
            });
            return;
        }

        await AdminConfigCache.deleteConfig(key);
        logger.info({
            configUpdate: {
                message: `Admin config deleted: ${key} (old value: ${existingValue})`,
                key,
                prevValue: existingValue,
            },
            user: interaction.user.id,
        });

        const embed = new EmbedBuilder()
            .setTitle('Configuration Deleted')
            .setColor('DarkRed')
            .setTimestamp()
            .addFields(
                { name: 'Key', value: `\`${key}\``, inline: true },
                { name: 'Previous Value', value: `\`${existingValue}\``, inline: true }
            );

        await interaction.editReply({ embeds: [embed] });
    }
}
