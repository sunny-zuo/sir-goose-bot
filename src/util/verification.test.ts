import { serializeVerificationRules } from './verification';
import { VerificationRules, VerificationImportV2 } from '#types/Verification';

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
});
