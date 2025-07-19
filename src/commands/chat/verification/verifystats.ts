import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import { ChatInputCommandInteraction, EmbedBuilder, Snowflake, Role, inlineCode } from 'discord.js';
import { GuildConfigCache } from '#util/guildConfigCache';
import UserModel from '#models/user.model';

export class VerifyStats extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'verifystats',
            description: "Shows stats relating to verification in the guild you're in.",
            category: 'Verification',
            aliases: ['verificationstats', 'serverstats', 'vs'],
            guildOnly: true,
            isTextCommand: false,
            cooldownSeconds: 60,
        });
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const { guild } = interaction;
        if (!guild) return;

        await interaction.deferReply();

        const config = await GuildConfigCache.fetchConfig(guild.id);

        if (!config.enableVerification) {
            const embed = new EmbedBuilder()
                .setTitle('Verification Not Enabled')
                .setDescription("Verification is not enabled on this server, so I can't display any stats.")
                .setColor('Yellow')
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const roleIds: Snowflake[] = [];
        for (const rule of config.verificationRules?.rules ?? []) {
            for (const role of rule.roles) {
                roleIds.push(role.id);
            }
        }

        const roles = (
            (await Promise.all([...new Set(roleIds)].map((id) => guild.roles.fetch(id)))).filter((role) => role !== null) as Role[]
        ).sort((a, b) => b.rawPosition - a.rawPosition);

        const maxInfoLabelLength = 16;
        const maxRoleNameLength = Math.max(
            maxInfoLabelLength,
            roles.reduce((max, role) => Math.max(max, role.name.length), 0)
        );

        const allMembers = await guild.members.fetch();
        const userMembers = allMembers.filter((member) => !member.user.bot);
        const botMembers = allMembers.filter((member) => member.user.bot);

        const userIds = userMembers.map((member) => member.id);
        const verifiedUserCount = await UserModel.countDocuments({ verified: true, discordId: { $in: userIds } });

        const embed = new EmbedBuilder()
            .setTitle('Server Verification Stats')
            .setColor('Blue')
            .setDescription(
                `
                ${this.formatLabel('Total Members', maxInfoLabelLength)} ${allMembers.size} (${userMembers.size} users, ${
                    botMembers.size
                } bots)
                ${this.formatLabel('Verified Members', maxInfoLabelLength)} ${verifiedUserCount}/${userMembers.size} (${(
                    (verifiedUserCount / userMembers.size) *
                    100
                ).toFixed(2)}%)
                `
            )
            .addFields({
                name: 'Roles',
                value: roles.map((role) => `${this.formatLabel(role.name, maxRoleNameLength)} ${role.members.size} Members`).join('\n'),
            })
            .setTimestamp();

        const guildIconURL = guild.iconURL();
        guildIconURL ? embed.setThumbnail(guildIconURL) : null;

        await interaction.editReply({ embeds: [embed] });
    }

    formatLabel(label: string, length: number): string {
        return inlineCode(`${label.padStart(length)}:`);
    }
}
