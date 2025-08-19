import { Collection, Role, Snowflake } from 'discord.js';
import { parseRoles } from '#util/verificationRoles';

describe('verification roles util', () => {
    describe('parseRoles', () => {
        let mockGuildRoles: Collection<Snowflake, Role>;

        beforeEach(() => {
            mockGuildRoles = new Collection();
        });

        const createMockRole = (id: string, name: string, editable = true): Role => {
            return {
                id,
                name,
                editable,
            } as Role;
        };

        it('should successfully parse valid role names', () => {
            const studentRole = createMockRole('123', 'Student');
            const alumniRole = createMockRole('456', 'Alumni');

            mockGuildRoles.set('123', studentRole);
            mockGuildRoles.set('456', alumniRole);

            const result = parseRoles(['Student', 'Alumni'], mockGuildRoles);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toHaveLength(2);
                expect(result.value[0]).toEqual({ id: '123', name: 'Student' });
                expect(result.value[1]).toEqual({ id: '456', name: 'Alumni' });
            }
        });

        it('should handle single role successfully', () => {
            const studentRole = createMockRole('123', 'Student');
            mockGuildRoles.set('123', studentRole);

            const result = parseRoles(['Student'], mockGuildRoles);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toHaveLength(1);
                expect(result.value[0]).toEqual({ id: '123', name: 'Student' });
            }
        });

        it('should trim whitespace from role names', () => {
            const studentRole = createMockRole('123', 'Student');
            mockGuildRoles.set('123', studentRole);

            const result = parseRoles(['  Student  ', ' Student'], mockGuildRoles);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('The same role name appears multiple times in the roles to be assigned from this rule.');
            }
        });

        it('should fail when duplicate role names are provided', () => {
            const studentRole = createMockRole('123', 'Student');
            mockGuildRoles.set('123', studentRole);

            const result = parseRoles(['Student', 'Student'], mockGuildRoles);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe('The same role name appears multiple times in the roles to be assigned from this rule.');
            }
        });

        it('should fail when role does not exist on server', () => {
            const studentRole = createMockRole('123', 'Student');
            mockGuildRoles.set('123', studentRole);

            const result = parseRoles(['Student', 'NonExistentRole'], mockGuildRoles);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    'The role "NonExistentRole" could not be found on this server. Please confirm the role exists, and then try again.'
                );
            }
        });

        it('should fail when role is not editable', () => {
            const studentRole = createMockRole('123', 'Student', true);
            const adminRole = createMockRole('456', 'Admin', false);

            mockGuildRoles.set('123', studentRole);
            mockGuildRoles.set('456', adminRole);

            const result = parseRoles(['Student', 'Admin'], mockGuildRoles);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    'I do not have permission to assign the "Admin" role. Make sure I have the `Manage Roles` permission and that my role is placed above all roles that you want to assign.'
                );
            }
        });

        it('should handle empty role names array', () => {
            const result = parseRoles([], mockGuildRoles);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toHaveLength(0);
            }
        });

        it('should handle roles with special characters in names', () => {
            const specialRole = createMockRole('123', 'CS-2024 @Students!');
            mockGuildRoles.set('123', specialRole);

            const result = parseRoles(['CS-2024 @Students!'], mockGuildRoles);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.value).toHaveLength(1);
                expect(result.value[0]).toEqual({ id: '123', name: 'CS-2024 @Students!' });
            }
        });

        it('should fail on first non-editable role encountered', () => {
            const editableRole = createMockRole('123', 'Student', true);
            const nonEditableRole1 = createMockRole('456', 'Admin', false);
            const nonEditableRole2 = createMockRole('789', 'Moderator', false);

            mockGuildRoles.set('123', editableRole);
            mockGuildRoles.set('456', nonEditableRole1);
            mockGuildRoles.set('789', nonEditableRole2);

            const result = parseRoles(['Student', 'Admin', 'Moderator'], mockGuildRoles);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    'I do not have permission to assign the "Admin" role. Make sure I have the `Manage Roles` permission and that my role is placed above all roles that you want to assign.'
                );
            }
        });

        it('should fail on first missing role encountered', () => {
            const studentRole = createMockRole('123', 'Student');
            mockGuildRoles.set('123', studentRole);

            const result = parseRoles(['Student', 'MissingRole1', 'MissingRole2'], mockGuildRoles);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBe(
                    'The role "MissingRole1" could not be found on this server. Please confirm the role exists, and then try again.'
                );
            }
        });
    });
});
