import {
    ApplicationCommandOption,
    CommandInteraction,
    CommandInteractionOptionResolver,
    GuildMember,
    Message,
    MessageEmbed,
    Permissions,
} from 'discord.js';
import Client from '../../Client';
import { Command } from '../Command';
import BanModel from '../../models/ban.model';
import UserModel from '../../models/user.model';
import { Modlog } from '../../helpers/modlog';
import { chunk } from '../../helpers/array';

export class Ban extends Command {
    private static readonly options: ApplicationCommandOption[] = [
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
    ];

    constructor(client: Client) {
        super(client, {
            name: 'ban',
            description: 'Ban a user and all known alt accounts using their Waterloo ID',
            category: 'Moderation',
            options: Ban.options,
            guildOnly: true,
            examples: ['@user', '@user reason'],
            clientPermissions: [Permissions.FLAGS.BAN_MEMBERS],
            userPermissions: [Permissions.FLAGS.BAN_MEMBERS],
            cooldownSeconds: 2,
        });
    }

    async execute(interaction: Message | CommandInteraction, args: CommandInteractionOptionResolver): Promise<void> {
        const memberToBan = args.getMember('user') as GuildMember;
        const banUserInfo = await UserModel.findOne({ discordId: memberToBan.id });
        const banReason = args.getString('reason') ?? 'No reason provided.';
        const guild = interaction.guild;
        if (!guild) return;

        const modlogEmbeds: MessageEmbed[] = [];

        if (banUserInfo && banUserInfo.uwid) {
            const ban = new BanModel({
                guildId: guild.id,
                userId: banUserInfo.discordId,
                uwid: banUserInfo.uwid,
                reason: args.get('reason'),
                bannedBy: (interaction.member as GuildMember).id,
            });

            await ban.save();

            await guild.members.fetch();

            const possibleAlts = await UserModel.find({ uwid: banUserInfo.uwid, discordId: { $ne: banUserInfo.discordId } });

            for (const alt of possibleAlts) {
                const altMember = guild.members.cache.get(alt.discordId);
                if (altMember) {
                    const altBanMessage = `Banned by ${this.getUser(interaction).tag} | Alt of ${memberToBan.user.tag} | ${banReason}`;
                    await guild.bans.create(altMember, { reason: altBanMessage });

                    modlogEmbeds.push(
                        Modlog.getUserEmbed(
                            altMember.user,
                            `   
                            **User**: ${altMember}
                            **Action**: Ban
                            **Reason**: ${banReason} (alt of ${memberToBan.user.tag})
                            **Moderator**: ${interaction.member}
                            `,
                            'RED'
                        )
                    );
                }
            }
        }

        await memberToBan.send({
            embeds: [
                new MessageEmbed().setDescription(`You have been permanantly banned in ${guild.name} for: ${banReason}`).setColor('RED'),
            ],
        });
        const banMessage = `Banned by ${this.getUser(interaction).tag} | ${banReason}`;
        await guild.bans.create(memberToBan, { reason: banMessage });

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

        if (modlogEmbeds.length > 1) {
            await interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setDescription(`**${memberToBan} and ${modlogEmbeds.length - 1} alt accounts were banned |** ${banReason}`)
                        .setColor('GREEN'),
                ],
            });
        } else {
            await interaction.reply({
                embeds: [new MessageEmbed().setDescription(`**${memberToBan} was banned |** ${banReason}`).setColor('GREEN')],
            });
        }

        // max embed limit is 10 per message - this lets us properly log when a user has >10 alt accounts
        for (const embeds of chunk(modlogEmbeds, 10)) {
            await Modlog.logMessage(this.client, interaction.guild, { embeds });
        }
    }
}
