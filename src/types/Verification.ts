import { Snowflake } from 'discord.js';

enum RenameType {
    FULL_NAME = 'FULL_NAME',
    FIRST_NAME = 'FIRST_NAME',
}

export interface VerificationRules {
    baseYear: number;
    renameType?: RenameType;
    forceRename?: boolean;
    rules: VerificationRule[];
}

export interface VerificationRule {
    roles: RoleData[];
    department: string;
    matchType: string;
    yearMatch: string;
    year?: number;
}

export interface RoleData {
    name: string;
    id: Snowflake;
}
