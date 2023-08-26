import { ApplicationCommandOption, CommandInteraction, CommandInteractionOptionResolver, MessageEmbed, Permissions } from 'discord.js';
import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import BanModel from '#models/ban.model';
import UserModel from '#models/user.model';
import { Modlog } from '#util/modlog';
import { logger } from '#util/logger';

export class Unban extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'id',
            description: 'Unban a user by their discord user id',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'user',
                    description: 'The discord user to unban.',
                    type: 'USER',
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

        await interaction.deferReply();

        const userToUnban = args.getUser('user', true);
        const providedUnbanReason = args.getString('reason') ?? 'No reason provided.';
        const unbanReason = `Unbanned by ${interaction.user.tag} | Target unban user: ${userToUnban.tag} | ${providedUnbanReason}`;

        const userInfo = await UserModel.findOne({ discordId: userToUnban.id });
        const userIsVerified = userInfo && userInfo.uwid;
        const allAccountIds = userIsVerified
            ? await UserModel.find({ uwid: userInfo.uwid }).then((data) => data.map((user) => user.discordId))
            : [userToUnban.id];

        if (userIsVerified) {
            await BanModel.updateMany({ discordId: [...allAccountIds] }, { unbanned: true });
        }

        const unbannedUserIds = [];

        for (const accountId of allAccountIds) {
            const ban = await guild.bans.fetch(accountId).catch(() => undefined);
            if (ban) {
                try {
                    await guild.bans.remove(accountId, unbanReason);
                    unbannedUserIds.push(accountId);
                } catch (e) {
                    logger.warn(e, 'Failed to unban user when ban existed.');
                }
            }
        }

        if (unbannedUserIds.length === 0) {
            const nonVerifiedError = `Unable to unban user ${userToUnban.tag} - they are not banned, and they are not verified, so no alts could be found.`;
            const verifiedError = `Unable to unabn user ${userToUnban.tag} - they are not banned and no alts could be found.`;

            await interaction.reply({
                embeds: [new MessageEmbed().setDescription(userIsVerified ? verifiedError : nonVerifiedError).setColor('YELLOW')],
            });
        } else {
            logger.info({
                moderation: { action: 'unban', userId: userToUnban.id },
                guild: { id: guild.id },
                user: { id: this.getUser(interaction).id },
            });

            const altsWereUnbanned = unbannedUserIds.length > 1;
            const userMessage = altsWereUnbanned
                ? `${userToUnban} and alt accounts with ids: ${unbannedUserIds.filter((id) => id != userToUnban.id).join(', ')}`
                : `${userToUnban}`;

            await interaction.reply({
                embeds: [new MessageEmbed().setDescription(`${userMessage} was successfully unbanned.`).setColor('GREEN')],
            });

            await Modlog.logUserAction(
                this.client,
                guild,
                userToUnban,
                `
                    **User**: ${userMessage}
                    **Action**: Unban
                    **Reason**: ${unbanReason}
                    **Moderator**: ${interaction.member}
                `,
                'GREEN'
            );
        }
    }
}
