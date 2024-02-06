import {
    ApplicationCommandOption,
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
    GuildMember,
    EmbedBuilder,
    PermissionsBitField,
} from 'discord.js';
import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import BanModel from '#models/ban.model';
import UserModel from '#models/user.model';
import { Modlog } from '#util/modlog';
import { chunk } from '#util/array';
import { logger } from '#util/logger';

export class Ban extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'user',
            description: 'Ban a user by mentioning them',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user',
                    description: 'The user to ban.',
                    type: ApplicationCommandOptionType.User,
                    required: true,
                },
                {
                    name: 'reason',
                    description: 'The reason for the ban.',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
            ],
        },
        {
            name: 'id',
            description: 'Ban a user by their discord user id',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user_id',
                    description: 'The discord user id of the user to ban.',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: 'reason',
                    description: 'The reason for the ban.',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                },
            ],
        },
    ];

    constructor(client: Client) {
        super(client, {
            name: 'ban',
            description: 'Ban a user and all known alt accounts linked via their UWaterloo ID',
            category: 'Moderation',
            isTextCommand: false,
            options: Ban.options,
            guildOnly: true,
            examples: ['id 123456789012345678 reason', 'user @user reason'],
            clientPermissions: [PermissionsBitField.Flags.BanMembers],
            userPermissions: [PermissionsBitField.Flags.BanMembers],
            cooldownSeconds: 2,
        });
    }

    async execute(
        interaction: ChatInputCommandInteraction,
        args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        await interaction.deferReply();

        const guild = interaction.guild;
        if (!guild) return;

        const modlogEmbeds: EmbedBuilder[] = [];
        const banReason = args.getString('reason') ?? 'No reason provided.';
        const providedUserId = args.getString('user_id') ?? (args.getMember('user') as GuildMember)?.id;
        const memberToBan = await guild.members.fetch(providedUserId).catch(() => null);

        const banUserInfo = await UserModel.findOne({ discordId: providedUserId });
        const possibleAlts =
            banUserInfo && banUserInfo.uwid
                ? await UserModel.find({ uwid: banUserInfo.uwid, discordId: { $ne: banUserInfo.discordId } })
                : [];

        if (memberToBan && !memberToBan.bannable) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder().setDescription(`Unable to ban - I do not have permission to ban ${memberToBan}.`).setColor('Red'),
                ],
            });
            return;
        }

        for (const alt of possibleAlts) {
            const altMember = await guild.members.fetch(alt.discordId).catch(() => null);
            if (altMember && !altMember.bannable) {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(
                                `Unable to ban - I do not have permission to ban ${altMember}. (alt of the member you wanted to ban).`
                            )
                            .setColor('Red'),
                    ],
                });
                return;
            }
        }

        if (banUserInfo && banUserInfo.uwid) {
            const ban = new BanModel({
                guildId: guild.id,
                userId: banUserInfo.discordId,
                uwid: banUserInfo.uwid,
                reason: banReason,
                bannedBy: (interaction.member as GuildMember).id,
            });

            await ban.save();
        }

        for (const alt of possibleAlts) {
            const altMember = await guild.members.fetch(alt.discordId).catch(() => null);
            if (altMember && altMember.bannable) {
                const altBanMessage = `Banned by ${this.getUser(interaction).tag} | Alt of ${
                    memberToBan?.user.tag ?? `user with id ${providedUserId}`
                } | ${banReason}`;
                await guild.bans.create(altMember, { reason: altBanMessage });

                modlogEmbeds.push(
                    Modlog.getUserEmbed(
                        altMember.user,
                        `
                            **User**: ${altMember}
                            **Action**: Ban
                            **Reason**: ${banReason} (alt of ${memberToBan?.user.tag ?? `user with id ${providedUserId}`})
                            **Moderator**: ${interaction.member}
                            `,
                        'Red'
                    )
                );
            }
        }

        if (memberToBan) {
            await memberToBan
                .send({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(`You have been permanantly banned in ${guild.name} for: ${banReason}`)
                            .setColor('Red'),
                    ],
                })
                .catch(() => undefined);

            modlogEmbeds.unshift(
                Modlog.getUserEmbed(
                    memberToBan.user,
                    `
                    **User**: ${memberToBan}
                    **Action**: Ban
                    **Reason**: ${banReason}
                    **Moderator**: ${interaction.member}
                    `,
                    'Red'
                )
            );

            await guild.bans.create(providedUserId, { reason: `Banned by ${this.getUser(interaction).tag} | ${banReason}` });

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`**${memberToBan} and ${modlogEmbeds.length - 1} alt accounts were banned |** ${banReason}`)
                        .setColor('Green'),
                ],
            });
        } else if (banUserInfo && banUserInfo.uwid) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`**User ID ${providedUserId} and ${modlogEmbeds.length} alt accounts were banned |** ${banReason}`)
                        .setColor('Green'),
                ],
            });
        } else {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`Unable to ban user ID ${providedUserId} - they are not verified and are not in this server.`)
                        .setColor('Yellow'),
                ],
            });
        }

        // max embed limit is 10 per message - this lets us properly log when a user has >10 alt accounts
        for (const embeds of chunk(modlogEmbeds, 10)) {
            await Modlog.logMessage(this.client, interaction.guild, { embeds });
        }

        logger.info({
            moderation: { action: 'ban', userId: providedUserId },
            guild: { id: guild.id },
            user: { id: this.getUser(interaction).id },
        });
    }
}
