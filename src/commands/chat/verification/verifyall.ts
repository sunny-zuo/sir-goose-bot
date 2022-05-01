import { CommandInteraction, Message, MessageEmbed, Permissions } from 'discord.js';
import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import { GuildConfigCache } from '#util/guildConfigCache';
import { RoleAssignmentService } from '../../../services/roleAssignmentService';
import { logger } from '#util/logger';

export class VerifyAll extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'verifyall',
            description: 'Verify all existing users in the server that would be verified',
            category: 'Verification',
            cooldownSeconds: 3600,
            cooldownMaxUses: 5,
            clientPermissions: [Permissions.FLAGS.MANAGE_ROLES],
            userPermissions: [Permissions.FLAGS.MANAGE_GUILD],
        });
    }

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        if (!interaction.guild) return;

        const config = await GuildConfigCache.fetchConfig(interaction.guild.id);
        if (interaction.guild && config.enableVerification === false) {
            await this.sendErrorEmbed(interaction, 'Verification Not Enabled', 'This server does not have verification enabled.');
            return;
        }

        const invalidRoles = await RoleAssignmentService.getInvalidRoles(interaction.guild);

        if (invalidRoles.length > 0) {
            const invalidRoleText = invalidRoles.map((role) => `• \`${role.name}\` (id: ${role.id})`).join('\n');

            await this.sendErrorEmbed(
                interaction,
                'Invalid Roles',
                `The following roles in the ruleset either do not exist or can't be assigned by the bot:

                ${invalidRoleText}

                Make sure that the bot has the Manage Roles permission, is placed correctly in the role hierarchy and that all roles exist.
                `
            );
            return;
        }

        await interaction.guild.roles.fetch();

        const members = await interaction.guild.members.fetch();
        const total = members.size;
        let progress = 0;

        const embed = this.generateProgressEmbed(progress, total);

        // This will always return a Message if the bot user is in the guild
        const message = (await interaction.reply({ embeds: [embed], fetchReply: true })) as Message;

        const updateInterval = setInterval(async () => {
            await message.edit({ embeds: [this.generateProgressEmbed(progress, total)] });
        }, 8000);

        try {
            for (const member of members.values()) {
                const service = new RoleAssignmentService(this.client, member.id);
                const roleAssignment = await service.assignGuildRoles(interaction.guild, { log: false });
                progress++;

                if (roleAssignment.success && (roleAssignment.value.assignedRoles.length > 0 || roleAssignment.value.updatedName)) {
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
            }
        } catch (e) {
            clearInterval(updateInterval);
            logger.error(e, e.message);
            await message.edit({
                embeds: [
                    new MessageEmbed().setTitle('Unknown Error').setDescription(`
                            We ran into an unknown error trying to verify all users.
                            Please try again later or message ${process.env.OWNER_DISCORD_USERNAME} for help.

                            **Progress Made Before Error:**
                            ${this.generateProgressBar(progress, total)}
                        `),
                ],
            });
        }

        clearInterval(updateInterval);
        await message.edit({ embeds: [this.generateProgressEmbed(progress, total)] });
    }

    private generateProgressEmbed(progress: number, total: number): MessageEmbed {
        return new MessageEmbed()
            .setTitle(progress !== total ? `Attempting to verify all ${total} users...` : `All ${total} users have been verified!`)
            .setDescription(
                `
                This could take up to ${total * 2} seconds.

                **Progress:**
                ${this.generateProgressBar(progress, total)}
            `
            )
            .setColor(progress === total ? 'GREEN' : 'BLUE');
    }

    private generateProgressBar(progress: number, total: number): string {
        const width = 20;
        const complete = Math.floor((progress / total) * width);
        return `${'█'.repeat(complete)}${'░'.repeat(width - complete)} (${progress}/${total})`;
    }
}
