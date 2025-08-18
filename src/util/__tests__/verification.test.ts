import { serializeVerificationRules, parseRule } from '../verification';
import * as VerificationRoleUtil from '../verificationRoles';
import { VerificationRules, VerificationImportV2, VerificationRuleImportV2 } from '#types/Verification';
import { Collection, Role, Snowflake } from 'discord.js';

describe('verification utilities', () => {
    describe('serializeVerificationRules', () => {
        it('should return empty string for undefined rules', () => {
            const result = serializeVerificationRules(undefined);
            expect(result).toBe('');
        });

        it('should serialize basic verification rules without unverified roles', () => {
            const rules: VerificationRules = {
                baseYear: 2020,
                rules: [
                    {
                        roles: [{ id: '123', name: 'Student' }],
                        department: 'MAT/Mathematics Computer Science',
                        matchType: 'exact',
                        yearMatch: 'equal',
                        year: 2023,
                    },
                ],
            };

            const result = serializeVerificationRules(rules);
            const parsed = JSON.parse(result) as VerificationImportV2;

            expect(parsed.v).toBe(2);
            expect(parsed.rules).toHaveLength(1);
            expect(parsed.rules[0]).toEqual({
                roles: ['Student'],
                department: 'MAT/Mathematics Computer Science',
                match: 'exact',
                yearMatch: 'equal',
                year: 2023,
            });
            expect(parsed.unverified).toBeUndefined();
        });

        it('should serialize verification rules with unverified roles', () => {
            const rules: VerificationRules = {
                baseYear: 2020,
                rules: [
                    {
                        roles: [{ id: '123', name: 'Student' }],
                        department: 'MAT/Mathematics Computer Science',
                        matchType: 'exact',
                        yearMatch: 'equal',
                        year: 2023,
                    },
                ],
                unverified: {
                    roles: [
                        { id: '456', name: 'Unverified' },
                        { id: '789', name: 'Pending' },
                    ],
                },
            };

            const result = serializeVerificationRules(rules);
            const parsed = JSON.parse(result) as VerificationImportV2;

            expect(parsed.v).toBe(2);
            expect(parsed.rules).toHaveLength(1);
            expect(parsed.unverified).toEqual({
                roles: ['Unverified', 'Pending'],
            });
        });

        it('should not include unverified section when roles array is empty', () => {
            const rules: VerificationRules = {
                baseYear: 2020,
                rules: [
                    {
                        roles: [{ id: '123', name: 'Student' }],
                        department: 'MAT/Mathematics Computer Science',
                        matchType: 'exact',
                        yearMatch: 'equal',
                        year: 2023,
                    },
                ],
                unverified: {
                    roles: [],
                },
            };

            const result = serializeVerificationRules(rules);
            const parsed = JSON.parse(result) as VerificationImportV2;

            expect(parsed.unverified).toBeUndefined();
        });

        it('should serialize multiple verification rules with unverified roles', () => {
            const rules: VerificationRules = {
                baseYear: 2020,
                rules: [
                    {
                        roles: [{ id: '123', name: 'Student' }],
                        department: 'MAT/Mathematics Computer Science',
                        matchType: 'exact',
                        yearMatch: 'equal',
                        year: 2023,
                    },
                    {
                        roles: [{ id: '456', name: 'Alumni' }],
                        department: 'Alumni',
                        matchType: 'anything',
                        yearMatch: 'all',
                    },
                ],
                unverified: {
                    roles: [{ id: '789', name: 'Unverified' }],
                },
            };

            const result = serializeVerificationRules(rules);
            const parsed = JSON.parse(result) as VerificationImportV2;

            expect(parsed.v).toBe(2);
            expect(parsed.rules).toHaveLength(2);
            expect(parsed.rules[0]).toEqual({
                roles: ['Student'],
                department: 'MAT/Mathematics Computer Science',
                match: 'exact',
                yearMatch: 'equal',
                year: 2023,
            });
            expect(parsed.rules[1]).toEqual({
                roles: ['Alumni'],
                department: 'Alumni',
                match: 'anything',
                yearMatch: 'all',
                year: undefined,
            });
            expect(parsed.unverified).toEqual({
                roles: ['Unverified'],
            });
        });

        it('should handle rules without year field', () => {
            const rules: VerificationRules = {
                baseYear: 2020,
                rules: [
                    {
                        roles: [{ id: '123', name: 'Student' }],
                        department: 'Alumni',
                        matchType: 'anything',
                        yearMatch: 'all',
                    },
                ],
            };

            const result = serializeVerificationRules(rules);
            const parsed = JSON.parse(result) as VerificationImportV2;

            expect(parsed.rules[0].year).toBeUndefined();
        });
    });

    describe('parseRule', () => {
        let mockGuildRoles: Collection<Snowflake, Role>;
        let parseRolesSpy = jest.spyOn(VerificationRoleUtil, 'parseRoles');

        beforeEach(() => {
            mockGuildRoles = new Collection();
            parseRolesSpy = jest.spyOn(VerificationRoleUtil, 'parseRoles');
        });

        afterEach(() => {
            // restore the original function implementation after each test
            jest.restoreAllMocks();
        });

        const createValidImportedRule = (overrides: Partial<VerificationRuleImportV2> = {}): VerificationRuleImportV2 => ({
            roles: ['Student'],
            department: 'MAT/Mathematics Computer Science',
            match: 'exact',
            yearMatch: 'equal',
            year: 2023,
            ...overrides,
        });

        it('should successfully parse a valid rule with year', () => {
            const importedRule = createValidImportedRule();
            const mockRoleData = [{ id: '123', name: 'Student' }];
            parseRolesSpy.mockReturnValue({ success: true, value: mockRoleData });

            const result = parseRule(importedRule, mockGuildRoles);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual({
                    roles: mockRoleData,
                    department: 'MAT/Mathematics Computer Science',
                    matchType: 'exact',
                    yearMatch: 'equal',
                    year: 2023,
                });
            }
            expect(parseRolesSpy).toHaveBeenCalledWith(['Student'], mockGuildRoles);
        });

        it('should successfully parse a valid rule without year (yearMatch: all)', () => {
            const importedRule = createValidImportedRule({
                yearMatch: 'all',
                year: undefined,
            });
            const mockRoleData = [{ id: '123', name: 'Student' }];
            parseRolesSpy.mockReturnValue({ success: true, value: mockRoleData });

            const result = parseRule(importedRule, mockGuildRoles);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toEqual({
                    roles: mockRoleData,
                    department: 'MAT/Mathematics Computer Science',
                    matchType: 'exact',
                    yearMatch: 'all',
                });
                expect(result.value.year).toBeUndefined();
            }
        });

        it('should fail when no roles are specified', () => {
            const importedRule = createValidImportedRule({ roles: [] });

            const result = parseRule(importedRule, mockGuildRoles);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    'No roles to be assigned are specified for this rule. Please ensure you are copy and pasting correctly from the [rule creation tool](https://sebot.sunnyzuo.com/).'
                );
            }
            expect(parseRolesSpy).not.toHaveBeenCalled();
        });

        it('should fail when roles array is undefined', () => {
            const importedRule = createValidImportedRule({ roles: undefined });

            const result = parseRule(importedRule, mockGuildRoles);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    'No roles to be assigned are specified for this rule. Please ensure you are copy and pasting correctly from the [rule creation tool](https://sebot.sunnyzuo.com/).'
                );
            }
        });

        it('should fail when department is missing', () => {
            const importedRule = createValidImportedRule({ department: '' });

            const result = parseRule(importedRule, mockGuildRoles);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    'The department to match with is missing from this rule. Please ensure you are copy and pasting correctly from the [rule creation tool](https://sebot.sunnyzuo.com/).'
                );
            }
        });

        it('should fail when department is undefined', () => {
            const importedRule = createValidImportedRule({ department: undefined });

            const result = parseRule(importedRule, mockGuildRoles);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    'The department to match with is missing from this rule. Please ensure you are copy and pasting correctly from the [rule creation tool](https://sebot.sunnyzuo.com/).'
                );
            }
        });

        it('should fail when match type is invalid', () => {
            const importedRule = createValidImportedRule({ match: 'invalid' });

            const result = parseRule(importedRule, mockGuildRoles);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    'The specified department match type is invalid. Please ensure you are copy and pasting correctly from the [rule creation tool](https://sebot.sunnyzuo.com/).'
                );
            }
        });

        it('should fail when match type is missing', () => {
            const importedRule = createValidImportedRule({ match: undefined });

            const result = parseRule(importedRule, mockGuildRoles);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    'The specified department match type is invalid. Please ensure you are copy and pasting correctly from the [rule creation tool](https://sebot.sunnyzuo.com/).'
                );
            }
        });

        it('should accept all valid match types', () => {
            const validMatchTypes = ['anything', 'exact', 'begins', 'contains'];
            const mockRoleData = [{ id: '123', name: 'Student' }];
            parseRolesSpy.mockReturnValue({ success: true, value: mockRoleData });

            validMatchTypes.forEach((matchType) => {
                const importedRule = createValidImportedRule({
                    match: matchType,
                    yearMatch: 'all', // avoid year validation
                });

                const result = parseRule(importedRule, mockGuildRoles);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.value.matchType).toBe(matchType);
                }
            });
        });

        it('should fail when yearMatch type is invalid', () => {
            const importedRule = createValidImportedRule({ yearMatch: 'invalid' });

            const result = parseRule(importedRule, mockGuildRoles);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    'The specified year match type is invalid. Please ensure you are copy and pasting correctly from the [rule creation tool](https://sebot.sunnyzuo.com/).'
                );
            }
        });

        it('should fail when yearMatch type is missing', () => {
            const importedRule = createValidImportedRule({ yearMatch: undefined });

            const result = parseRule(importedRule, mockGuildRoles);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    'The specified year match type is invalid. Please ensure you are copy and pasting correctly from the [rule creation tool](https://sebot.sunnyzuo.com/).'
                );
            }
        });

        it('should accept all valid yearMatch types', () => {
            const validYearMatchTypes = ['all', 'equal', 'upper', 'lower'];
            const mockRoleData = [{ id: '123', name: 'Student' }];
            parseRolesSpy.mockReturnValue({ success: true, value: mockRoleData });

            validYearMatchTypes.forEach((yearMatchType) => {
                const importedRule = createValidImportedRule({
                    yearMatch: yearMatchType,
                    year: yearMatchType === 'all' ? undefined : 2023,
                });

                const result = parseRule(importedRule, mockGuildRoles);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.value.yearMatch).toBe(yearMatchType);
                }
            });
        });

        it('should fail when VerificationUtil.parseRoles returns an error', () => {
            const importedRule = createValidImportedRule();
            const parseRolesError = 'Role parsing failed';
            parseRolesSpy.mockReturnValue({ success: false, error: parseRolesError });

            const result = parseRule(importedRule, mockGuildRoles);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(parseRolesError);
            }
        });

        it('should fail when year is not a valid number', () => {
            const importedRule = createValidImportedRule({
                yearMatch: 'equal',
                year: 'not-a-number' as unknown as number,
            });
            const mockRoleData = [{ id: '123', name: 'Student' }];
            parseRolesSpy.mockReturnValue({ success: true, value: mockRoleData });

            const result = parseRule(importedRule, mockGuildRoles);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    'The specified year to match is not a valid number. Please ensure you are copy and pasting correctly from the [rule creation tool](https://sebot.sunnyzuo.com/).'
                );
            }
        });

        it('should fail when year is not an integer', () => {
            const importedRule = createValidImportedRule({
                yearMatch: 'equal',
                year: 2023.5,
            });
            const mockRoleData = [{ id: '123', name: 'Student' }];
            parseRolesSpy.mockReturnValue({ success: true, value: mockRoleData });

            const result = parseRule(importedRule, mockGuildRoles);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    'The specified year to match is not an integer. Please ensure you are copy and pasting correctly from the [rule creation tool](https://sebot.sunnyzuo.com/).'
                );
            }
        });

        it('should handle multiple roles successfully', () => {
            const importedRule = createValidImportedRule({
                roles: ['Student', 'Alumni', 'Moderator'],
                yearMatch: 'all',
            });
            const mockRoleData = [
                { id: '123', name: 'Student' },
                { id: '456', name: 'Alumni' },
                { id: '789', name: 'Moderator' },
            ];
            parseRolesSpy.mockReturnValue({ success: true, value: mockRoleData });

            const result = parseRule(importedRule, mockGuildRoles);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.roles).toEqual(mockRoleData);
            }
            expect(parseRolesSpy).toHaveBeenCalledWith(['Student', 'Alumni', 'Moderator'], mockGuildRoles);
        });

        it('should convert department to strings, years to number', () => {
            const importedRule = createValidImportedRule({
                department: 123 as unknown as string,
                year: '456' as unknown as number,
                yearMatch: 'equal',
            });
            const mockRoleData = [{ id: '123', name: 'Student' }];
            parseRolesSpy.mockReturnValue({ success: true, value: mockRoleData });

            const result = parseRule(importedRule, mockGuildRoles);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.department).toBe('123');
                expect(result.value.year).toBe(456);
            }
        });

        it('should handle zero as a valid year', () => {
            const importedRule = createValidImportedRule({
                yearMatch: 'lower',
                year: 0,
            });
            const mockRoleData = [{ id: '123', name: 'Student' }];
            parseRolesSpy.mockReturnValue({ success: true, value: mockRoleData });

            const result = parseRule(importedRule, mockGuildRoles);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.year).toBe(0);
            }
        });

        it('should handle negative years as valid', () => {
            const importedRule = createValidImportedRule({
                yearMatch: 'equal',
                year: -2023,
            });
            const mockRoleData = [{ id: '123', name: 'Student' }];
            parseRolesSpy.mockReturnValue({ success: true, value: mockRoleData });

            const result = parseRule(importedRule, mockGuildRoles);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value.year).toBe(-2023);
            }
        });
    });
});
