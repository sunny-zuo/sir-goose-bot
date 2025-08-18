import { Result } from '#types/index';
import { RoleData } from '#types/Verification';
import { Collection, inlineCode, Role, Snowflake } from 'discord.js';

/**
 * Parse an imported list of role names into a list of RoleData objects
 * @param rawRoleNames the raw role names to parse from the rule creation tool
 * @param guildRoles the roles available on the guild that the rule is being created for
 * @returns
 */
export function parseRoles(rawRoleNames: string[], guildRoles: Collection<Snowflake, Role>): Result<RoleData[], string> {
    const roleNames = new Set(rawRoleNames.map((name) => name.trim()));
    if (roleNames.size !== rawRoleNames.length) {
        return {
            success: false,
            error: `The same role name appears multiple times in the roles to be assigned from this rule.`,
        };
    }

    const parsedRoles: RoleData[] = [];
    for (const roleName of roleNames) {
        const role = guildRoles.find((role) => role.name === roleName);

        if (!role) {
            return {
                success: false,
                error: `The role "${roleName}" could not be found on this server. Please confirm the role exists, and then try again.`,
            };
        } else if (!role.editable) {
            return {
                success: false,
                error: `I do not have permission to assign the "${roleName}" role. Make sure I have the ${inlineCode(
                    'Manage Roles'
                )} permission and that my role is placed above all roles that you want to assign.`,
            };
        } else {
            parsedRoles.push({ id: role.id, name: role.name });
        }
    }

    return { success: true, value: parsedRoles };
}
