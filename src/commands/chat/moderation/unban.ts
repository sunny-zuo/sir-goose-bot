import {
    ApplicationCommandOption,
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
    EmbedBuilder,
    PermissionsBitField,
    inlineCode,
    hyperlink,
} from 'discord.js';
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
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'user_id',
                    description: 'The discord user id to unban.',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
                {
                    name: 'reason',
                    description: 'The reason for the unban.',
                    type: ApplicationCommandOptionType.String,
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
            clientPermissions: [PermissionsBitField.Flags.BanMembers],
            userPermissions: [PermissionsBitField.Flags.BanMembers],
            cooldownSeconds: 2,
        });
    }

    async execute(
        interaction: ChatInputCommandInteraction,
        args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const guild = interaction.guild;
        if (!guild) return;

        await interaction.deferReply();

        const userIdToUnban = args.getString('user_id', true);
        const providedUnbanReason = args.getString('reason') ?? 'No reason provided.';
        const unbanReason = `Unbanned by ${interaction.user.tag} | Target unban user id: ${userIdToUnban} | ${providedUnbanReason}`;

        const userInfo = await UserModel.findOne({ discordId: userIdToUnban });
        const userIsVerified = userInfo && userInfo.uwid;
        const allAccountIds = userIsVerified
            ? await UserModel.find({ uwid: userInfo.uwid }).then((data) => data.map((user) => user.discordId))
            : [userIdToUnban];

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
            const userIdHelp = `It's also possible that you're using an invalid user id. User IDs are a long string of numbers, that look like ${inlineCode(
                '1144955602704019500'
            )}. ${hyperlink(
                'Learn how to find user IDs here.',
                'https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-'
            )}`;

            const nonVerifiedError = `Unable to unban user with id ${inlineCode(
                userIdToUnban
            )} - they are not banned, and they are not verified, so no alts could be found.\n\n${userIdHelp}`;
            const verifiedError = `Unable to unban user with id ${inlineCode(
                userIdToUnban
            )} - they are not banned and no alts could be found.\n\n${userIdHelp}`;

            await interaction.editReply({
                embeds: [new EmbedBuilder().setDescription(userIsVerified ? verifiedError : nonVerifiedError).setColor('Yellow')],
            });
        } else {
            logger.info({
                moderation: { action: 'unban', userId: userIdToUnban },
                guild: { id: guild.id },
                user: { id: interaction.user.id },
            });

            const altsWereUnbanned = unbannedUserIds.length > 1;
            const userMessage = altsWereUnbanned
                ? `User with id ${inlineCode(userIdToUnban)} and alt accounts with ids: ${unbannedUserIds
                      .filter((id) => id != userIdToUnban)
                      .map((id) => inlineCode(id))
                      .join(', ')}`
                : `User with id ${inlineCode(userIdToUnban)}`;

            await interaction.editReply({
                embeds: [new EmbedBuilder().setDescription(`${userMessage} was successfully unbanned.`).setColor('Green')],
            });

            await Modlog.logUserAction(
                this.client,
                guild,
                interaction.user,
                `
                    **User**: ${userMessage}
                    **Action**: Unban
                    **Reason**: ${unbanReason}
                    **Moderator**: ${interaction.member}
                `,
                'Green'
            );
        }
    }
}
