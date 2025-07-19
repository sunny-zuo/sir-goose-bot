import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    PermissionsBitField,
    ApplicationCommandOption,
    ApplicationCommandOptionType,
    CommandInteractionOptionResolver,
} from 'discord.js';
import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import { GuildConfigCache } from '#util/guildConfigCache';
import { handleViewOverride } from './verifyOverrideFlows/verifyOverrideView';
import { handleDeleteOverride } from './verifyOverrideFlows/verifyOverrideDelete';
import { handleCreateOverride } from './verifyOverrideFlows/verifyOverrideCreate';
import { logger } from '#util/logger';

export class VerifyOverride extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'create',
            description: 'Override the department or year used for verification for selected users.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user',
                    description: 'User to override verification data for',
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
                {
                    name: 'department',
                    description: '[Optional] The verification department to set for the chosen user.',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
                {
                    name: 'entranceyear',
                    description: '[Optional] The entrance year to set for the chosen user.',
                    type: ApplicationCommandOptionType.Number,
                    minValue: 2000,
                    // intentionally cap at 3 years in the future to make it more clear that it is entrance year
                    maxValue: new Date().getFullYear() + 3,
                    required: false,
                },
            ],
        },
        {
            name: 'view',
            description: 'View the existing verification override for a specific user.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user',
                    description: 'User to view override for.',
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
            ],
        },
        {
            name: 'delete',
            description: 'Delete an existing verification override for a user.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user',
                    description: 'User to delete override for.',
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
            ],
        },
    ];

    constructor(client: Client) {
        super(client, {
            name: 'verifyoverride',
            description: 'Manually override the department and/or entrance year of a user for verification purposes.',
            category: 'Verification',
            options: VerifyOverride.options,
            guildOnly: true,
            clientPermissions: [PermissionsBitField.Flags.ManageRoles],
            userPermissions: [PermissionsBitField.Flags.ManageGuild, PermissionsBitField.Flags.ManageRoles],
        });
    }

    async execute(
        interaction: ChatInputCommandInteraction,
        args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        await interaction.deferReply();

        const allowedGuilds = [
            '694232686247542815', // SE 25
            '1348807287254552657', // SE 30
            '811408878162935829', // big SE
            '532052305982259210', // dev test server
        ];
        if (!interaction.guildId || !allowedGuilds.includes(interaction.guildId)) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Yellow')
                        .setDescription(
                            'This feature is in private preview. Want early access? Ask in the [support server](https://discord.gg/KHByMmrrw2).'
                        ),
                ],
            });
            return;
        }

        const config = await GuildConfigCache.fetchConfig(interaction.guild!.id);
        if (!config.enableVerification) {
            await this.sendErrorEmbed(
                interaction,
                'Verification Not Enabled',
                `This server does not have verification enabled.

                Looking to enable verification? [Read the guide.](https://sir-goose.notion.site/sir-goose/Setting-Up-Verification-0f309b2a00fc4e198b5f2182d2452fcd)`
            );
            return;
        }

        const subcommand = args.getSubcommand();
        switch (subcommand) {
            case 'create': {
                const users = [args.getUser('user', true)];
                const customDept = args.getString('department') ?? undefined;
                const customYear = args.getNumber('entranceyear')?.toString();

                await handleCreateOverride(interaction, interaction.user, users, customDept, customYear);
                break;
            }
            case 'view': {
                const targetUser = args.getUser('user', true);
                await handleViewOverride(interaction, targetUser, interaction.guild!);
                break;
            }
            case 'delete': {
                const targetUser = args.getUser('user', true);
                await handleDeleteOverride(interaction, targetUser, interaction.guild!);
                break;
            }
            case 'list': {
                // TODO: support this
                break;
            }
            default:
                logger.error(args.data, 'Invalid subcommand provided for verifyoverride');
        }
    }
}
