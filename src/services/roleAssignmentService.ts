import fs from 'fs';
import path from 'path';
import { SHA256 } from 'crypto-js';
import { Collection, Guild, Permissions, Role, Snowflake } from 'discord.js';
import Client from '../Client';
import { GuildConfigCache } from '../helpers/guildConfigCache';
import UserModel from '../models/user.model';
import GuildModel from '../models/guildConfig.model';
import { Result } from '../types/';
import { Modlog } from '../helpers/modlog';

type CustomFileImport = { type: 'hash' | 'uwid'; department: string | null; entranceYear: number | null; ids: string[] };
type CustomValues = { departments: string[]; entranceYear: number | null };

export class RoleAssignmentService {
    static customImport: Collection<string, CustomValues> = new Collection<string, CustomValues>();
    client: Client;
    userId: Snowflake;

    static parseCustomImports(client: Client): void {
        const dirLocation = path.join(process.cwd(), 'src', 'data', 'verification');
        const files = fs.readdirSync(dirLocation);

        client.log.info(`Loading custom departments/entrance years from ${files.length} files`);

        for (const file of files) {
            if (!file.endsWith('.json')) {
                continue;
            }
            try {
                const customFile: CustomFileImport = JSON.parse(fs.readFileSync(path.join(dirLocation, file), 'utf8'));

                for (const id of customFile.ids) {
                    const idHash = customFile.type === 'hash' ? id : SHA256(id).toString();
                    const userVals = this.customImport.get(idHash) ?? { departments: [], entranceYear: null };

                    if (customFile.department !== null) {
                        userVals.departments.push(customFile.department);
                    }

                    if (customFile.entranceYear !== null) {
                        if (userVals.entranceYear !== null && userVals.entranceYear !== customFile.entranceYear) {
                            client.log.warn(`User with id ${idHash} has been assigned a different entrance year multiple times`);
                        }
                        userVals.entranceYear = customFile.entranceYear;
                    }

                    this.customImport.set(idHash, userVals);
                }
            } catch (e) {
                client.log.error(`Error parsing custom user data file "${file}": ${e}`);
            }
        }

        client.log.info(`Loaded custom departments/entrance years!`);
    }

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

    async assignGuildRoles(guild: Guild): Promise<Result<Role[], string>> {
        const guildModel = await GuildConfigCache.fetchConfig(guild.id);
        if (
            !guildModel ||
            !guildModel.enableVerification ||
            !guildModel.verificationRules ||
            guildModel.verificationRules.rules.length === 0
        ) {
            return { success: false, error: 'No verification rules set' };
        }

        const member = await guild.members.fetch(this.userId).catch(() => undefined);
        const user = await UserModel.findOne({ discordId: this.userId });

        if (member && user && user.verified) {
            const allRoles = await this.getMatchingRoles(guild);
            const missingRoles = allRoles.filter((role) => !member.roles.cache.has(role.id));

            if (missingRoles.length > 0) {
                await member.roles.add(missingRoles, 'Verified via Sir Goose Bot');
                await Modlog.logUserAction(
                    this.client,
                    guild,
                    member.user,
                    `${member} successfully verified and was assigned the ${missingRoles
                        .map((role) => `\`${role.name}\``)
                        .join(', ')} role(s).`,
                    'GREEN'
                );
            } else if (user.verifyRequestedServerId === guild.id && allRoles.length === 0) {
                await Modlog.logUserAction(
                    this.client,
                    guild,
                    member.user,
                    `${member} successfully verified but was not assigned any roles due to the server configuration.`,
                    'BLUE'
                );
            }

            if (guildModel.verificationRules.renameType === 'FULL_NAME' || guildModel.verificationRules.renameType === 'FIRST_NAME') {
                const renameType = guildModel.verificationRules.renameType;
                const newNickname = renameType === 'FIRST_NAME' ? `${user.givenName}` : `${user.givenName} ${user.surname}`;

                if (!member.nickname || (member.nickname !== newNickname && guildModel.verificationRules.forceRename)) {
                    if (member.manageable && guild.me?.permissions.has(Permissions.FLAGS.MANAGE_NICKNAMES)) {
                        await member.setNickname(newNickname);
                    }
                }
            }

            this.client.log.info(`Assigned ${missingRoles.length} role(s) to ${member.user.tag} (${this.userId}) in "${guild.name}"`);
            return { success: true, value: missingRoles };
        }

        return { success: false, error: 'User is not verified' };
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

        const customValues = RoleAssignmentService.customImport.get(SHA256(user.uwid).toString());
        const matchingRoles: Role[] = [];

        let departments: string[] = [user.department];
        const customDepartments = customValues?.departments ?? [];
        departments = [...departments, ...customDepartments];

        const entranceYear = customValues?.entranceYear ?? user.o365CreatedDate.getFullYear();

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
                        Modlog.logInfoMessage(
                            this.client,
                            guild,
                            'Verification Role Assignment Error',
                            `We attempted to assign the role "${roleData.name}" to <@${this.userId}>, but the role not found or could not be assigned due to hierarchy issues.`,
                            'RED'
                        );
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
