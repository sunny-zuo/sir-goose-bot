import { ApplicationCommandOption, CommandInteraction, CommandInteractionOptionResolver, MessageEmbed, Permissions } from 'discord.js';
import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import BanModel from '#models/ban.model';
import UserModel from '#models/user.model';
import { Modlog } from '#util/modlog';
import { chunk } from '#util/array';
import { logger } from '#util/logger';

export class Unban extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'id',
            description: 'Unban a user by their discord user id',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'user_id',
                    description: 'The discord user id of the user to unban.',
                    type: 'STRING',
                    required: true,
                },
                {
                    name: 'reason',
                    description: 'The reason for the unban.',
                    type: 'STRING',
                    required: false,
                },
            ],
        },
    ];

    constructor(client: Client) {
        super(client, {
            name: 'unban',
            description: 'Unban a user and all known alt accounts linked via their UWaterloo ID',
            category: 'Moderation',
            isTextCommand: false,
            options: Unban.options,
            guildOnly: true,
            examples: ['id 123456789012345678 reason'],
            clientPermissions: [Permissions.FLAGS.BAN_MEMBERS],
            userPermissions: [Permissions.FLAGS.BAN_MEMBERS],
            cooldownSeconds: 2,
        });
    }

    async execute(
        interaction: CommandInteraction,
        args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const guild = interaction.guild;
        if (!guild) return;

        const modlogEmbeds: MessageEmbed[] = [];
        const unbanReason = args.getString('reason') ?? 'No reason provided.';
        const providedUserId = args.getString('user_id', true);
        const bannedUser = await guild.bans.fetch(providedUserId);

        if (!bannedUser) {
            await this.sendErrorEmbed(interaction, 'User Not Banned', `Unable to ban user ID ${providedUserId} - they are not banned.`);
        }

        const unbanUserInfo = await UserModel.findOne({ discordId: providedUserId });
        const possibleAlts = unbanUserInfo && unbanUserInfo.uwid ? await UserModel.find({ uwid: unbanUserInfo.uwid }) : [];

        if (unbanUserInfo && unbanUserInfo.uwid) {
            await BanModel.updateMany(
                { discordId: [providedUserId, ...possibleAlts.map((alt) => alt.uwid).filter((uwid) => !!uwid)] },
                { unbanned: true }
            );
        }

        for (const alt of possibleAlts) {
            const altMember = guild.bans.cache.get(alt.discordId);
            if (altMember) {
                const altUnbanMessage = `Unbanned by ${this.getUser(interaction).tag} | Alt of ${
                    bannedUser?.user.tag ?? `user with id ${providedUserId}`
                } | ${unbanReason}`;

                await guild.bans.remove(alt.discordId, altUnbanMessage);

                modlogEmbeds.push(
                    Modlog.getUserEmbed(
                        altMember.user,
                        `
                            **User**: ${altMember}
                            **Action**: Unban
                            **Reason**: ${unbanReason} (alt of ${bannedUser?.user.tag ?? `user with id ${providedUserId}`})
                            **Moderator**: ${interaction.member}
                        `,
                        'GREEN'
                    )
                );
            }
        }

        if (bannedUser || possibleAlts.length) {
            if (bannedUser) {
                modlogEmbeds.unshift(
                    Modlog.getUserEmbed(
                        bannedUser.user,
                        `
                        **User**: ${bannedUser}
                        **Action**: Unban
                        **Reason**: ${unbanReason}
                        **Moderator**: ${interaction.member}
                        `,
                        'GREEN'
                    )
                );

                await guild.bans.remove(providedUserId, `Unbanned by ${this.getUser(interaction).tag} | ${unbanReason}`);
            }

            await interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setDescription(
                            `**User ID ${providedUserId} and ${modlogEmbeds.length - 1} alt accounts were unbanned |** ${unbanReason}`
                        )
                        .setColor('GREEN'),
                ],
            });
        } else {
            await interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setDescription(`Unable to unban user ID ${providedUserId} - they are not verified or are not banned.`)
                        .setColor('YELLOW'),
                ],
            });
        }

        // max embed limit is 10 per message - this lets us properly log when a user has >10 alt accounts
        for (const embeds of chunk(modlogEmbeds, 10)) {
            await Modlog.logMessage(this.client, interaction.guild, { embeds });
        }

        logger.info({
            moderation: { action: 'unban', userId: providedUserId },
            guild: { id: guild.id },
            user: { id: this.getUser(interaction).id },
        });
    }
}
