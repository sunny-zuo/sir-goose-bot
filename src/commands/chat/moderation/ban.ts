import {
    ApplicationCommandOption,
    CommandInteraction,
    CommandInteractionOptionResolver,
    Guild,
    GuildMember,
    Message,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
    MessageEmbed,
    Permissions,
    Snowflake,
} from 'discord.js';
import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import BanModel from '#models/ban.model';
import UserModel from '#models/user.model';
import { Modlog } from '#util/modlog';
import { chunk } from '#util/array';
import { logger } from '#util/logger';
import { createMessageComponentFilter } from '#util/createMessageComponentFilter';
import { time } from '@discordjs/builders';
import message from '../../contextMenu/message';
import { safeFetchMember, safeFetchMembers } from '#util/safeFetch';

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
            isTextCommand: false,
            options: Ban.options,
            guildOnly: true,
            examples: ['id 123456789012345678 reason', 'user @user reason'],
            clientPermissions: [Permissions.FLAGS.BAN_MEMBERS],
            userPermissions: [Permissions.FLAGS.BAN_MEMBERS],
            cooldownSeconds: 2,
        });
    }

    async execute(
        interaction: CommandInteraction,
        args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        logger.info('start');
        const member = await interaction.guild!.members.fetch('test');
        const result = await safeFetchMembers(interaction.guild!, ['279235999958040577', '1234596849320211111301111111', 'test']);
        logger.info(result?.toJSON());
        logger.info('end');
        // const subcommand = await args.getSubcommand();
        // switch (subcommand) {
        //     case 'id':
        //         await this.banById(interaction, args);
        //         break;
        //     case 'user':
        //     default:
        //         logger.error(args.data, 'Invalid subcommand provided for ban');
        // }
        // ----- SEPARATOR -----
        // const guild = interaction.guild;
        // if (!guild) return;
        // const modlogEmbeds: MessageEmbed[] = [];
        // const banReason = args.getString('reason') ?? 'No reason provided.';
        // const providedUserId = args.getString('user_id') ?? (args.getMember('user') as GuildMember)?.id;
        // const memberToBan = await guild.members.fetch(providedUserId);
        // const banUserInfo = await UserModel.findOne({ discordId: providedUserId });
        // const possibleAlts =
        //     banUserInfo && banUserInfo.uwid
        //         ? await UserModel.find({ uwid: banUserInfo.uwid, discordId: { $ne: banUserInfo.discordId } })
        //         : [];
        // if (memberToBan && !memberToBan.bannable) {
        //     await this.sendErrorEmbed(interaction, 'Unable To Ban', `I do not have permission to ban ${memberToBan}.`);
        //     return;
        // }
        // for (const alt of possibleAlts) {
        //     const altMember = guild.members.cache.get(alt.discordId);
        //     if (altMember && !altMember.bannable) {
        //         await this.sendErrorEmbed(
        //             interaction,
        //             'Unable To Ban',
        //             `I do not have permission to ban ${altMember}. (alt of the member you wanted to ban)`
        //         );
        //         return;
        //     }
        // }
        // if (banUserInfo && banUserInfo.uwid) {
        //     const ban = new BanModel({
        //         guildId: guild.id,
        //         userId: banUserInfo.discordId,
        //         uwid: banUserInfo.uwid,
        //         reason: banReason,
        //         bannedBy: (interaction.member as GuildMember).id,
        //     });
        //     await ban.save();
        // }
        // for (const alt of possibleAlts) {
        //     const altMember = guild.members.cache.get(alt.discordId);
        //     if (altMember && altMember.bannable) {
        //         const altBanMessage = `Banned by ${this.getUser(interaction).tag} | Alt of ${
        //             memberToBan?.user.tag ?? `user with id ${providedUserId}`
        //         } | ${banReason}`;
        //         await guild.bans.create(altMember, { reason: altBanMessage });
        //         modlogEmbeds.push(
        //             Modlog.getUserEmbed(
        //                 altMember.user,
        //                 `
        //                     **User**: ${altMember}
        //                     **Action**: Ban
        //                     **Reason**: ${banReason} (alt of ${memberToBan?.user.tag ?? `user with id ${providedUserId}`})
        //                     **Moderator**: ${interaction.member}
        //                     `,
        //                 'RED'
        //             )
        //         );
        //     }
        // }
        // if (memberToBan) {
        //     await memberToBan
        //         .send({
        //             embeds: [
        //                 new MessageEmbed()
        //                     .setDescription(`You have been permanantly banned in ${guild.name} for: ${banReason}`)
        //                     .setColor('RED'),
        //             ],
        //         })
        //         .catch(() => undefined);
        //     modlogEmbeds.unshift(
        //         Modlog.getUserEmbed(
        //             memberToBan.user,
        //             `
        //             **User**: ${memberToBan}
        //             **Action**: Ban
        //             **Reason**: ${banReason}
        //             **Moderator**: ${interaction.member}
        //             `,
        //             'RED'
        //         )
        //     );
        // await guild.bans.create(providedUserId, { reason: `Banned by ${this.getUser(interaction).tag} | ${banReason}` });
        // await interaction.reply({
        //     embeds: [
        //         new MessageEmbed()
        //             .setDescription(`**${memberToBan} and ${modlogEmbeds.length - 1} alt accounts were banned |** ${banReason}`)
        //             .setColor('GREEN'),
        //     ],
        // });
        // } else if (banUserInfo && banUserInfo.uwid) {
        //     await interaction.reply({
        //         embeds: [
        //             new MessageEmbed()
        //                 .setDescription(`**User ID ${providedUserId} and ${modlogEmbeds.length} alt accounts were banned |** ${banReason}`)
        //                 .setColor('GREEN'),
        //         ],
        //     });
        // } else {
        //     await interaction.reply({
        //         embeds: [
        //             new MessageEmbed()
        //                 .setDescription(`Unable to ban user ID ${providedUserId} - they are not verified and are not in this server.`)
        //                 .setColor('YELLOW'),
        //         ],
        //     });
        // }
        // // max embed limit is 10 per message - this lets us properly log when a user has >10 alt accounts
        // for (const embeds of chunk(modlogEmbeds, 10)) {
        //     await Modlog.logMessage(this.client, interaction.guild, { embeds });
        // }
        // logger.info({
        //     moderation: { action: 'ban', userId: providedUserId },
        //     guild: { id: guild.id },
        //     user: { id: this.getUser(interaction).id },
        // });
    }

    async banById(interaction: CommandInteraction, args: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>) {
        const reply = (await interaction.deferReply({ fetchReply: true })) as Message;
        const guild = interaction.guild;
        if (!guild) return;

        const userId = args.getString('user_id', true);
        const banReason = args.getString('reason') ?? 'No reason provided.';

        const userInfo = await UserModel.findOne({ discordId: userId });
        const member = await safeFetchMember(guild, userId);

        if (member && !member.bannable) {
            return await this.editErrorReply(interaction, `I do not have permission to ban ${member}.`);
        }
        if (banReason.length > 500) {
            return await this.editErrorReply(interaction, `The ban reason cannot be longer than 500 characters.`);
        }

        const alts = await this.fetchAlts(guild, userId, userInfo?.uwid);
        if (alts.some((alt) => !alt.bannable)) {
            return await this.editErrorReply(
                interaction,
                `The user you are trying to ban has an alt (${alts.find((alt) => !alt.bannable)}) that I do not have permission to ban.`
            );
        }

        const memberString = member ? `${member} (${member.user.tag})` : `user id ${userId}`;
        const confirmationEmbed = new MessageEmbed().setDescription(`Are you sure you want to ban ${memberString}?`).setColor('YELLOW');
        const buttons = new MessageActionRow().addComponents(
            new MessageButton().setCustomId('banConfirm').setStyle('DANGER').setLabel('Ban'),
            new MessageButton().setCustomId('banCancel').setStyle('SECONDARY').setLabel('Cancel')
        );
        await interaction.editReply({ embeds: [confirmationEmbed], components: [buttons] });

        const bInteraction = await reply
            .awaitMessageComponent({
                filter: createMessageComponentFilter(interaction.user.id),
                componentType: 'BUTTON',
                time: 1000 * 60 * 5,
            })
            .catch(async (e) => {
                if (e.name === 'Error [INTERACTION_COLLECTOR_ERROR]') {
                    const embed = new MessageEmbed().setColor('YELLOW').setDescription(`Ban request for ${memberString} timed out.`);
                    await interaction.editReply({ embeds: [embed], components: [] });
                } else throw e;
            });

        if (!bInteraction) return;

        if (bInteraction.customId === 'banCancel') {
            const embed = new MessageEmbed().setColor('GREY').setDescription(`This ban request was cancelled.`);
            await interaction.editReply({ embeds: [embed], components: [] });
            return;
        } else if (bInteraction.customId === 'banConfirm') {
            const modlogEmbeds: MessageEmbed[] = [];

            const ban = new BanModel({
                guildId: guild.id,
                userId: userId,
                uwid: userInfo?.uwid,
                reason: banReason,
                bannedBy: (interaction.member as GuildMember).id,
            });
            await ban.save();

            await this.banAndNotify(guild, userId, banReason);

            modlogEmbeds.push(
                new MessageEmbed()
                    .setAuthor({ name: memberString })
                    .setColor('RED')
                    .setDescription(
                        `
                        **User**: ${memberString}
                        **Action**: Ban
                        **Reason**: ${banReason}
                        **Moderator**: ${interaction.member}
                        `
                    )
                    .setFooter({ text: `ID: ${userId}` })
                    .setTimestamp()
            );

            for (const alt of alts) {
                if (alt.bannable) {
                    await alt.ban();
                    modlogEmbeds.push(
                        Modlog.getUserEmbed(
                            alt.user,
                            `
                            **User**: ${alt}
                            **Action**: Ban
                            **Reason**: ${banReason}
                            **Moderator**: ${interaction.member}
                            `,
                            'RED'
                        )
                    );
                }
            }

            await interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setDescription(`**${memberString} and ${modlogEmbeds.length - 1} alt accounts were banned |** ${banReason}`)
                        .setColor('GREEN'),
                ],
            });

            logger.info({
                moderation: { action: 'ban', userId: userId },
                guild: { id: guild.id },
                user: { id: this.getUser(interaction).id },
            });
        }
    }

    async isAlreadyBanned(guild: Guild, userId: Snowflake): Promise<boolean> {
        try {
            await guild.bans.fetch(userId);
            return true;
        } catch {
            return false;
        }
    }

    async banAndNotify(guild: Guild, userId: Snowflake, reason: string) {
        const member = guild.members.cache.find((user) => user.id === userId);

        if (member) {
            await member
                .send({
                    embeds: [
                        new MessageEmbed()
                            .setDescription(`You have been permanantly banned in ${guild.name} for: ${reason}`)
                            .setColor('RED'),
                    ],
                })
                .catch(() => undefined);
        }

        if (!this.isAlreadyBanned(guild, userId)) {
            await guild.bans.create(userId, { reason });
        }
    }

    async fetchAlts(guild: Guild, discordId: Snowflake, uwid: string | undefined): Promise<GuildMember[]> {
        if (!uwid) return [];

        const altDocs = await UserModel.find({ uwid: uwid, discordId: { $ne: discordId } });
        const altIds = altDocs.map((altDoc) => altDoc.discordId);
        const altCollection = await safeFetchMembers(guild, altIds);

        if (altCollection) return [...altCollection.values()];
        else return [];
    }

    async editErrorReply(interaction: CommandInteraction, message: string) {
        const embed = new MessageEmbed().setColor('RED').setDescription(message);
        await interaction.editReply({ embeds: [embed], components: [] });
    }

    async editWarningReply(interaction: CommandInteraction, message: string) {
        const embed = new MessageEmbed().setColor('YELLOW').setDescription(message);
        await interaction.editReply({ embeds: [embed], components: [] });
    }
}
