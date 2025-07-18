import fs from 'fs';
import path from 'path';
import { SHA256 } from 'crypto-js';
import { Collection, Guild, GuildMember, PermissionsBitField, Role, Snowflake, inlineCode } from 'discord.js';
import { GuildConfigCache } from '#util/guildConfigCache';
import UserModel, { User as UserInterface } from '#models/user.model';
import GuildModel, { GuildConfig } from '#models/guildConfig.model';
import BanModel from '#models/ban.model';
import { Result } from '../types';
import { Modlog } from '#util/modlog';
import { RoleData } from '#types/Verification';
import { logger } from '#util/logger';
import Client from '#src/Client';
import VerificationOverrideModel from '#models/verificationOverride.model';

type CustomFileImport = { type: 'hash' | 'uwid'; department: string | null; entranceYear: number | null; ids: string[] };
type CustomValues = { departments: string[]; entranceYear: number | null };
type AssignGuildRolesParams = { log?: boolean; returnMissing?: boolean; oldDepartment?: string; oldYear?: number; oldConfig?: GuildConfig };
export type RoleAssignmentResult = { assignedRoles: Role[]; updatedName?: string };

export class RoleAssignmentService {
    static customImport: Collection<string, CustomValues> = new Collection<string, CustomValues>();
    userId: Snowflake;

    static parseCustomImports(): void {
        const dirLocation = path.join(process.cwd(), 'src', 'data', 'verification');
        const files = fs.readdirSync(dirLocation);

        logger.info(`Loading custom departments/entrance years from ${files.filter((file) => file.endsWith('.json')).length} files`);

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
                            logger.warn(`User with id ${idHash} has been assigned a different entrance year multiple times`);
                        }
                        userVals.entranceYear = customFile.entranceYear;
                    }

                    this.customImport.set(idHash, userVals);
                }
            } catch (e) {
                logger.error(e, `Error parsing custom user data file ${file}: ${e.message}`);
            }
        }

        logger.info(`Successfully loaded custom departments/entrance years!`);
    }

    constructor(userId: Snowflake) {
        this.userId = userId;
    }

    async assignAllRoles(client: Client, oldDepartment?: string): Promise<void> {
        const guildModels = await GuildModel.find({ enableVerification: true });

        logger.info({ verification: 'assignAll', user: { id: this.userId } }, 'Assigning roles to user in all possible guilds');
        for (const guildModel of guildModels) {
            try {
                const guild = client.guilds.cache.get(guildModel.guildId);
                if (guild) {
                    await this.assignGuildRoles(guild, { oldDepartment });
                }
            } catch (e) {
                logger.error(e, e.message);
            }
        }
    }

    async assignGuildRoles(guild: Guild, params: AssignGuildRolesParams = {}): Promise<Result<RoleAssignmentResult, string>> {
        params = { log: true, returnMissing: true, ...params };

        const guildConfig = await GuildConfigCache.fetchConfig(guild.id);
        if (
            !guildConfig ||
            !guildConfig.enableVerification ||
            !guildConfig.verificationRules ||
            guildConfig.verificationRules.rules.length === 0
        ) {
            return { success: false, error: 'No verification rules set' };
        }

        const member = await guild.members.fetch(this.userId).catch(() => undefined);
        const user = await UserModel.findOne({ discordId: this.userId });
        // TODO: deal with global/guild scopes
        const override = await VerificationOverrideModel.findOne({
            discordId: this.userId,
            guildId: guild.id,
            deleted: { $exists: false },
        });

        const userIsVerified = user && user.verified && user.department && user.o365CreatedDate;
        // overrides can be used to verify users who are not verified as long as they are complete
        const userHasValidOverride = override && override.department && override.o365CreatedDate;

        if (member && (userIsVerified || userHasValidOverride)) {
            logger.info({ verification: 'assignOne', user: { id: member.id }, guild: { id: guild.id } });

            const userBan = await (async () => {
                if (user) {
                    return BanModel.findOne({
                        guildId: guild.id,
                        uwid: user.uwid,
                        unbanned: false,
                        $or: [{ expiry: { $gte: new Date() } }, { expiry: { $exists: false } }],
                    });
                } else {
                    return BanModel.findOne({
                        guildId: guild.id,
                        userId: this.userId,
                        unbanned: false,
                        $or: [{ expiry: { $gte: new Date() } }, { expiry: { $exists: false } }],
                    });
                }
            })();

            if (userBan) {
                await Modlog.logUserAction(
                    guild,
                    member.user,
                    `We attempted to verify ${member} but did not assign any roles as they are banned. ${
                        userBan.userId !== member.id ? `(Alt of user id ${userBan.userId})` : ''
                    }`,
                    'Yellow'
                );

                return { success: false, error: 'User is banned' };
            }

            const defaultUserInfo =
                user !== null
                    ? user.toObject()
                    : { department: undefined, o365CreatedDate: undefined, discordId: member.id, verified: true };

            const getNewUserRolesToAssign = async () => {
                if (override) {
                    const overriddenUser = { ...defaultUserInfo };
                    if (override.department) overriddenUser.department = override.department;
                    if (override.o365CreatedDate) overriddenUser.o365CreatedDate = override.o365CreatedDate;
                    return this.getMatchingRoles(guild, guildConfig, overriddenUser, true, true); // skip custom imports so that override takes precedence
                } else {
                    return this.getMatchingRoles(guild, guildConfig, defaultUserInfo);
                }
            };
            const getOldUserRolesToRemove = async () => {
                if (params.oldDepartment || params.oldYear || override || params.oldConfig) {
                    // build the old user info object that would have been used to assign roles
                    // apply old user info before overrides if they exist, as this reflects how it works in practice
                    const oldUserInfo = { ...defaultUserInfo };
                    if (params.oldDepartment) oldUserInfo.department = params.oldDepartment;
                    if (params.oldYear) oldUserInfo.o365CreatedDate = new Date(params.oldYear, 5);
                    if (override && params.oldConfig !== undefined) {
                        // only apply the override if the config changed
                        // if the config did not change, an override was likely just applied so we want to add the override associated roles
                        // TODO: cleanup this logic
                        if (override.department) oldUserInfo.department = override.department;
                        if (override.o365CreatedDate) oldUserInfo.o365CreatedDate = override.o365CreatedDate;
                    }

                    if (params.oldConfig) {
                        return this.getMatchingRoles(guild, params.oldConfig, oldUserInfo, false);
                    } else {
                        return this.getMatchingRoles(guild, guildConfig, oldUserInfo, false);
                    }
                } else {
                    return [];
                }
            };

            const newRoles = await getNewUserRolesToAssign();
            const oldRoles = await getOldUserRolesToRemove();

            const rolesToSet = member.roles.cache.clone();
            const missingRoles = newRoles.filter((role) => !member.roles.cache.has(role.id));

            oldRoles.map((role) => rolesToSet.delete(role.id));
            newRoles.map((role) => rolesToSet.set(role.id, role));

            // custom actions for specific servers that want behavior not supported by rules
            // todo: build this out into rules
            if (guild.id === '767143197813112833') {
                // UWaterloo WiE server, remove the "Unverified" role
                rolesToSet.delete('865768247366385664');
            } else if (guild.id === '798546372038098984') {
                // Co-op Connection server, remove the "Unverified" role
                rolesToSet.delete('800477641978806334');
            }

            const overrideString = override ? ` (overridden by <@${override.createdBy}> via ${inlineCode('/verifyoverride')})` : '';
            if (!rolesToSet.equals(member.roles.cache)) {
                await member.roles.set(rolesToSet, 'Verified via Sir Goose Bot');
                if (params.log) {
                    await Modlog.logUserAction(
                        guild,
                        member.user,
                        `${member} successfully verified and was assigned the ${newRoles
                            .map((role) => `\`${role.name}\``)
                            .join(', ')} role(s).${overrideString}`,
                        'Green'
                    );
                }
            } else if (user && user.verifyRequestedServerId === guild.id && newRoles.length === 0) {
                if (params.log) {
                    await Modlog.logUserAction(
                        guild,
                        member.user,
                        `${member} successfully verified but was not assigned any roles due to the server configuration.${overrideString}`,
                        'Blue'
                    );
                }
            }

            const newNickname = await (async () => {
                // only try to rename users who are verified as we don't know the names of unverified users
                if (user) {
                    return this.updateNickname(
                        member,
                        user,
                        guildConfig.verificationRules?.renameType,
                        guildConfig.verificationRules?.forceRename
                    );
                } else {
                    return undefined;
                }
            })();

            return {
                success: true,
                value: {
                    assignedRoles: params.returnMissing ? missingRoles : newRoles,
                    updatedName: newNickname,
                },
            };
        }

        return { success: false, error: 'User is not verified' };
    }

    private async updateNickname(
        member: GuildMember,
        user: Pick<UserInterface, 'givenName' | 'surname'>,
        renameType?: string,
        forceRename?: boolean
    ): Promise<string | undefined> {
        if (renameType === 'FULL_NAME' || renameType === 'FIRST_NAME') {
            const newNickname = renameType === 'FIRST_NAME' ? `${user.givenName?.split(' ')[0]}` : `${user.givenName} ${user.surname}`;

            if (newNickname !== undefined) {
                if (!member.nickname || (member.nickname !== newNickname && forceRename)) {
                    if (member.manageable && member.guild.members.me?.permissions.has(PermissionsBitField.Flags.ManageNicknames)) {
                        logger.info({ verification: 'rename', user: { id: this.userId }, guild: { id: member.guild.id } });
                        await member.setNickname(newNickname);
                        return newNickname;
                    }
                }
            } else {
                logger.warn(
                    { verification: 'rename', user: { id: this.userId }, guild: { id: member.guild.id } },
                    'Role assignment service was used on user who had an undefined name.'
                );
            }
        }

        return undefined;
    }

    async getMatchingRoles(guild: Guild, config: GuildConfig, user: UserInterface, log = true, skipCustomImport = false): Promise<Role[]> {
        const roleData = RoleAssignmentService.getMatchingRoleData(user, config, skipCustomImport);

        const validRoles = [];
        const invalidRoles = [];

        for (const roleDatum of roleData) {
            const role = guild.roles.cache.get(roleDatum.id);

            if (role && role.editable) {
                validRoles.push(role);
            } else {
                invalidRoles.push(roleDatum);
            }
        }

        if (invalidRoles.length > 0) {
            if (log) {
                await Modlog.logInfoMessage(
                    guild,
                    'Verification Role Assignment Error',
                    `We attempted to assign the role(s) ${invalidRoles.map((role) => `"${role.name}" (${role.id})`).join(', ')} to <@${
                        this.userId
                    }>, but the role not found or could not be assigned due to hierarchy or permissions issues. Make sure my role has the Manage Roles permission and is above all roles you want to assign.`,
                    'Red'
                );
            }
        }
        return validRoles;
    }

    static async getInvalidRoles(guild: Guild): Promise<RoleData[]> {
        const config = await GuildConfigCache.fetchConfig(guild.id);
        if (!config?.verificationRules?.rules || config.verificationRules.rules.length === 0) return [];

        await guild.roles.fetch();

        const invalidRoles = [];

        for (const rule of config.verificationRules.rules) {
            for (const roleDatum of rule.roles) {
                const role = guild.roles.cache.get(roleDatum.id);
                if (!role || !role.editable) {
                    invalidRoles.push(roleDatum);
                }
            }
        }

        return invalidRoles;
    }

    static getMatchingRoleData(
        user: Pick<UserInterface, 'verified' | 'department' | 'o365CreatedDate' | 'uwid'> | null,
        config: Pick<GuildConfig, 'enableVerification' | 'verificationRules'> | null,
        // TODO: refactor to remove having to do this by creating a VerifiedUser class that wraps all of the different override types
        skipCustomImport: boolean = false
    ): RoleData[] {
        if (
            !user ||
            !user.uwid ||
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

        const customValues = skipCustomImport ? undefined : RoleAssignmentService.customImport.get(SHA256(user.uwid).toString());

        let departments: string[] = [user.department];
        const customDepartments = customValues?.departments ?? [];
        departments = [...departments, ...customDepartments];

        // students who started before 2020 will have an o365CreatedDate in March 2020, so we mark them as 2019.
        function parseO365Year(createdDate: Date): number {
            if (createdDate.getFullYear() === 2020 && createdDate.getMonth() < 5) return 2019;
            return createdDate.getFullYear();
        }

        const entranceYear = customValues?.entranceYear ?? parseO365Year(user.o365CreatedDate);

        for (const rule of config.verificationRules.rules) {
            if (
                this.isMatchingYear(entranceYear, rule.year ?? config.verificationRules.baseYear, rule.yearMatch) &&
                this.isMatchingDepartment(departments, rule.department, rule.matchType)
            ) {
                return rule.roles;
            }
        }

        return [];
    }

    private static isMatchingYear(entranceYear: number, checkYear: number, checkType: string): boolean {
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

    private static isMatchingDepartment(departments: string[], departmentToMatch: string, matchType: string): boolean {
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
