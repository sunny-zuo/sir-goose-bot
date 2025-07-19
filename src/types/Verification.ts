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

export const VerificationDepartmentList = [
    {
        name: 'ART/Arts',
        description: 'Faculty of Arts students, excluding AFM',
        emoji: '📚',
    },
    {
        name: 'ART/Arts Accounting and Finance',
        description: 'AFM students',
        emoji: '📈',
    },
    {
        name: 'Alumni',
        description: 'Alumni',
        emoji: '🎓',
    },
    {
        name: 'ENG/Architecture',
        description: 'Architecture students',
        emoji: '🏛️',
    },
    {
        name: 'ENG/Architectural Engineering',
        description: 'Architectural Engineering students',
        emoji: '🏗️',
    },
    {
        name: 'ENG/Chemical',
        description: 'Chemical Engineering students',
        emoji: '🧪',
    },
    {
        name: 'ENG/Civil & Environmental',
        description: 'Civil and Environmental Engineering students',
        emoji: '🌍',
    },
    {
        name: 'ENG/Electrical and Computer',
        description: 'ECE students',
        emoji: '💻',
    },
    {
        name: 'ENG/Engineering',
        description: 'BME, Nano and Geological engineering students',
        emoji: '🔧',
    },
    {
        name: 'ENG/MGMT Management Sciences',
        description: 'Management Engineering',
        emoji: '📊',
    },
    {
        name: 'ENG/Mechanical & Mechatronics',
        description: 'Mechanical and Tron students',
        emoji: '🔩',
    },
    {
        name: 'ENG/Systems Design',
        description: 'SYDE students',
        emoji: '🛠️',
    },
    {
        name: 'VPA/Software Engineering',
        description: 'Software Engineering students',
        emoji: '💾',
    },
    {
        name: 'ENV/Environment',
        description: 'Environment students',
        emoji: '🌿',
    },
    {
        name: 'HLTH/Faculty of Health',
        description: 'Faculty of Health students',
        emoji: '🏥',
    },
    {
        name: 'MAT/Mathematics',
        description: 'Faculty of Math students, excluding CS',
        emoji: '🧮',
    },
    {
        name: 'MAT/Mathematics Computer Science',
        description: 'CS students',
        emoji: '🖥️',
    },
    {
        name: 'SCI/Science',
        description: 'Science students, excluding pharmacy and optometry',
        emoji: '🔬',
    },
    {
        name: 'SCI/Science Optometry',
        description: 'Optometry students',
        emoji: '👀',
    },
    {
        name: 'SCI/Science Pharmacy',
        description: 'Pharmacy students',
        emoji: '💊',
    },
] as const;

// the default starting years is every year from 2019 up until the current year, plus 1
const currentYear = new Date().getFullYear();
export const VerificationDefaultStartingYears = Array.from({ length: currentYear - 2019 + 2 }, (_, i) => 2019 + i);
