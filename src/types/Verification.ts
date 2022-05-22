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

// deprecated
export interface VerificationRuleImportV1 {
    roles: string[];
    department: string;
    match: string;
    year: string;
}
// deprecated
export interface VerificationImportV1 {
    baseYear: number;
    rules: VerificationRuleImportV1[];
}

export interface VerificationRuleImportV2 {
    roles: string[];
    department: string;
    match: string;
    yearMatch: string;
    year?: number;
}

export interface VerificationImportV2 {
    v: number;
    rules: VerificationRuleImportV2[];
}
