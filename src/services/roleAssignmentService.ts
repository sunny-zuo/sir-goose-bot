import { Guild, Role, Snowflake } from 'discord.js';
import Client from '../Client';
import { GuildConfigCache } from '../helpers/guildConfigCache';
import UserModel from '../models/user.model';
import GuildModel from '../models/guildConfig.model';

export class RoleAssignmentService {
    client: Client;
    userId: Snowflake;

    constructor(client: Client, userId: Snowflake) {
        this.client = client;
        this.userId = userId;
    }

    async assignAllRoles(): Promise<void> {
        const guildModels = await GuildModel.find({ enableVerification: true });

        this.client.log.info(`Assigning roles to user with id ${this.userId} in all possible guilds`);
        for (const guildModel of guildModels) {
            const guild = await this.client.guilds.fetch(guildModel.guildId);

            await this.assignGuildRoles(guild);
        }
    }

    async assignGuildRoles(guild: Guild): Promise<void> {
        const guildModel = await GuildConfigCache.fetchConfig(guild.id);
        if (
            !guildModel ||
            !guildModel.enableVerification ||
            !guildModel.verificationRules ||
            guildModel.verificationRules.rules.length === 0
        ) {
            return;
        }

        const member = await guild.members.fetch(this.userId).catch(() => undefined);

        if (member) {
            const allRoles = await this.getMatchingRoles(guild);
            const missingRoles = allRoles.filter((role) => !member.roles.cache.has(role.id));

            if (missingRoles.length > 0) {
                await member.roles.add(missingRoles, 'Verified via Sir Goose Bot');
            }

            this.client.log.info(`Assigned ${missingRoles.length} role(s) to ${member.user.tag} (${this.userId}) in "${guild.name}"`);
        }
    }

    private async getMatchingRoles(guild: Guild): Promise<Role[]> {
        const user = await UserModel.findOne({ discordId: this.userId });
        const config = await GuildConfigCache.fetchConfig(guild.id);

        if (
            !user ||
            !user.verified ||
            !user.department ||
            !user.o365CreatedDate ||
            !config ||
            !config.enableVerification ||
            !config.verificationRules ||
            config.verificationRules.rules.length === 0
        ) {
            return [];
        }

        const matchingRoles: Role[] = [];

        const departments: string[] = [user.department];
        const entranceYear = user.o365CreatedDate.getFullYear();

        for (const rule of config.verificationRules.rules) {
            if (
                this.checkYearMatch(entranceYear, rule.year ?? config.verificationRules.baseYear, rule.yearMatch) &&
                this.checkDepartmentMatch(departments, rule.department, rule.matchType)
            ) {
                await guild.roles.fetch();

                for (const roleData of rule.roles) {
                    const role = guild.roles.cache.get(roleData.id);

                    if (role && role.editable) {
                        matchingRoles.push(role);
                    } else {
                        // TODO: notify modlog
                    }
                }

                break;
            }
        }

        return matchingRoles;
    }

    private checkYearMatch(entranceYear: number, checkYear: number, checkType: string): boolean {
        if (checkType === 'all') {
            return true;
        } else if (checkType === 'equal') {
            return entranceYear === checkYear;
        } else if (checkType === 'upper') {
            return entranceYear < checkYear;
        } else if (checkType === 'lower') {
            return entranceYear > checkYear;
        } else {
            return false;
        }
    }

    private checkDepartmentMatch(departments: string[], departmentToMatch: string, matchType: string): boolean {
        if (matchType === 'anything') {
            return true;
        } else if (matchType === 'exact') {
            return departments.some((department) => department.toLowerCase() === departmentToMatch.toLowerCase());
        } else if (matchType === 'begins') {
            return departments.some((department) => department.toLowerCase().startsWith(departmentToMatch.toLowerCase()));
        } else if (matchType === 'contains') {
            return departments.some((department) => department.toLowerCase().includes(departmentToMatch.toLowerCase()));
        } else {
            return false;
        }
    }
}
