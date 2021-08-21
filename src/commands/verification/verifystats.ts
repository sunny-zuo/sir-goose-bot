import { Command } from '../Command';
import Client from '../../Client';
import { Message, CommandInteraction, MessageEmbed, Snowflake, Role } from 'discord.js';
import { inlineCode } from '@discordjs/builders';
import { GuildConfigCache } from '../../helpers/guildConfigCache';
import UserModel from '../../models/user.model';

export class VerifyStats extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'verifystats',
            description: "Shows stats relating to verification in the guild you're in.",
            category: 'Verification',
            aliases: ['verificationstats', 'serverstats'],
            guildOnly: true,
            cooldownSeconds: 60,
        });
    }

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        const { guild } = interaction;
        if (!guild) return;
        const config = await GuildConfigCache.fetchConfig(guild.id);

        if (!config.enableVerification) {
            const embed = new MessageEmbed()
                .setTitle('Verification Not Enabled')
                .setDescription("Verification is not enabled on this server, so I can't display any stats.")
                .setColor('YELLOW')
                .setTimestamp();
            interaction.reply({ embeds: [embed] });
            return;
        }

        const roleIds: Snowflake[] = [];
        for (const rule of config.verificationRules?.rules ?? []) {
            for (const role of rule.roles) {
                roleIds.push(role.id);
            }
        }

        const roles = (await Promise.all([...new Set(roleIds)].map((id) => guild.roles.fetch(id))))
            .filter((role) => role !== null)
            .sort((a, b) => b!.rawPosition - a!.rawPosition) as Role[];

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

        const embed = new MessageEmbed()
            .setTitle('Server Verification Stats')
            .setColor('BLUE')
            .setDescription(
                `
                ${this.formatLabel('Total Members', maxInfoLabelLength)} ${allMembers.size} (${userMembers.size} users, ${
                    botMembers.size
                } bots)
                ${this.formatLabel('Verified Members', maxInfoLabelLength)} ${verifiedUserCount}/${userMembers.size} (${
                    (verifiedUserCount / userMembers.size) * 100
                }%)
                `
            )
            .addField(
                'Roles',
                roles.map((role) => `${this.formatLabel(role.name, maxRoleNameLength)} ${role.members.size} Members`).join('\n')
            )
            .setTimestamp();

        const guildIconURL = guild.iconURL();
        guildIconURL ? embed.setThumbnail(guildIconURL) : null;

        interaction.reply({ embeds: [embed] });
    }

    formatLabel(label: string, length: number): string {
        return inlineCode(`${label.padStart(length)}:`);
    }
}
