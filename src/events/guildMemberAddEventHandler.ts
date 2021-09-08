import { GuildMember, MessageEmbed } from 'discord.js';
import Client from '../Client';
import { RoleAssignmentService } from '../services/roleAssignmentService';
import { GuildConfigCache } from '../helpers/guildConfigCache';
import { EventHandler } from './eventHandler';

export class GuildMemberAddEventHandler implements EventHandler {
    readonly eventName = 'guildMemberAdd';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(member: GuildMember): Promise<void> {
        const roleAssignmentService = new RoleAssignmentService(this.client, member.id);
        const roleAssignmentResult = await roleAssignmentService.assignGuildRoles(member.guild);

        if (roleAssignmentResult.success) {
            const assignedRoles = roleAssignmentResult.value;

            if (assignedRoles.length > 0) {
                await member.send({
                    embeds: [
                        new MessageEmbed()
                            .setTitle(`Welcome to ${member.guild.name}!`)
                            .setColor('GREEN')
                            .setDescription(
                                `Since you've verified with the bot in the past, you've been automatically verified and have received the ${assignedRoles
                                    .map((role) => `\`${role.name}\``)
                                    .join(', ')} role(s).`
                            ),
                    ],
                });
            } else if ((await GuildConfigCache.fetchConfig(member.guild.id)).enableVerification) {
                await member.send({
                    embeds: [
                        new MessageEmbed()
                            .setTitle(`Welcome to ${member.guild.name}!`)
                            .setColor('BLUE')
                            .setDescription(
                                "Since you've verified with the bot in the past, you've been automatically verified. However, the server has configured the bot to not assign any roles to you for various reasons (most likely due to only wanting to verify certain groups of people). If you think this is a mistake, please message a server admin."
                            ),
                    ],
                });
            }
        }
    }
}
