import {
    ApplicationCommandOption,
    CommandInteraction,
    CommandInteractionOptionResolver,
    GuildMember,
    Message,
    MessageEmbed,
    Permissions,
} from 'discord.js';
import Client from '../../../Client';
import { ChatCommand } from '../ChatCommand';
import BanModel from '../../../models/ban.model';
import UserModel from '../../../models/user.model';
import { Modlog } from '../../../helpers/modlog';
import { chunk } from '../../../helpers/array';
import { GuildConfigCache } from '../../../helpers/guildConfigCache';

export class Ban extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'user',
            description: 'Ban a user by mentioning them',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'user',
                    description: 'The user to ban.',
                    type: 'USER',
                    required: true,
                },
                {
                    name: 'reason',
                    description: 'The reason for the ban.',
                    type: 'STRING',
                    required: false,
                },
            ],
        },
        {
            name: 'id',
            description: 'Ban a user by their discord user id',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'user_id',
                    description: 'The discord user id of the user to ban.',
                    type: 'STRING',
                    required: true,
                },
                {
                    name: 'reason',
                    description: 'The reason for the ban.',
                    type: 'STRING',
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
            options: Ban.options,
            guildOnly: true,
            examples: ['id 123456789012345678 reason', 'user @user reason'],
            clientPermissions: [Permissions.FLAGS.BAN_MEMBERS],
            userPermissions: [Permissions.FLAGS.BAN_MEMBERS],
            cooldownSeconds: 2,
        });
    }

    async execute(
        interaction: Message | CommandInteraction,
        args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const guildConfig = await GuildConfigCache.fetchConfig(interaction.guild!.id);
        // TODO: Refactor once help message supports subcommands
        if (args === undefined || !args?.data || args.data.length === 0) {
            await this.sendErrorEmbed(
                interaction,
                'Usage:',
                `
                Ban by Discord ID: \`${guildConfig.prefix}ban id 123456789012345678 reason\`
                Ban by Discord user: \`${guildConfig.prefix}ban user @user reason\`
                `
            );
            return;
        }

        const guild = interaction.guild;
        if (!guild) return;
        await guild.members.fetch();

        const modlogEmbeds: MessageEmbed[] = [];
        const banReason = args.getString('reason') ?? 'No reason provided.';
        const providedUserId = args.getString('user_id') ?? (args.getMember('user') as GuildMember)?.id;
        const memberToBan = guild.members.cache.get(providedUserId);

        const banUserInfo = await UserModel.findOne({ discordId: providedUserId });
        const possibleAlts =
            banUserInfo && banUserInfo.uwid
                ? await UserModel.find({ uwid: banUserInfo.uwid, discordId: { $ne: banUserInfo.discordId } })
                : [];

        if (memberToBan && !memberToBan.bannable) {
            await this.sendErrorEmbed(interaction, 'Unable To Ban', `I do not have permission to ban ${memberToBan}.`);
            return;
        }

        for (const alt of possibleAlts) {
            const altMember = guild.members.cache.get(alt.discordId);
            if (altMember && !altMember.bannable) {
                await this.sendErrorEmbed(
                    interaction,
                    'Unable To Ban',
                    `I do not have permission to ban ${altMember}. (alt of the member you wanted to ban)`
                );
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
            const altMember = guild.members.cache.get(alt.discordId);
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
                        'RED'
                    )
                );
            }
        }

        if (memberToBan) {
            await memberToBan
                .send({
                    embeds: [
                        new MessageEmbed()
                            .setDescription(`You have been permanantly banned in ${guild.name} for: ${banReason}`)
                            .setColor('RED'),
                    ],
                })
                .catch(() => this.client.log.error(`Failed to send ban message to ${memberToBan.user.tag}`));

            modlogEmbeds.unshift(
                Modlog.getUserEmbed(
                    memberToBan.user,
                    `
                    **User**: ${memberToBan}
                    **Action**: Ban
                    **Reason**: ${banReason}
                    **Moderator**: ${interaction.member}
                    `,
                    'RED'
                )
            );

            await guild.bans.create(providedUserId, { reason: `Banned by ${this.getUser(interaction).tag} | ${banReason}` });

            await interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setDescription(`**${memberToBan} and ${modlogEmbeds.length - 1} alt accounts were banned |** ${banReason}`)
                        .setColor('GREEN'),
                ],
            });
        } else if (banUserInfo && banUserInfo.uwid) {
            await interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setDescription(`**User ID ${providedUserId} and ${modlogEmbeds.length} alt accounts were banned |** ${banReason}`)
                        .setColor('GREEN'),
                ],
            });
        } else {
            await interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setDescription(`Unable to ban user ID ${providedUserId} - they are not verified and are not in this server.`)
                        .setColor('YELLOW'),
                ],
            });
        }

        // max embed limit is 10 per message - this lets us properly log when a user has >10 alt accounts
        for (const embeds of chunk(modlogEmbeds, 10)) {
            await Modlog.logMessage(this.client, interaction.guild, { embeds });
        }

        this.client.log.info(
            `User ${this.getUser(interaction).tag} banned ${memberToBan?.user.tag ?? providedUserId} in server ${guild.name} (${guild.id}).`
        );
    }
}
