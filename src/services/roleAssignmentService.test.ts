import { GuildConfig } from '../models/guildConfig.model';
import { User } from '../models/user.model';
import { RoleAssignmentService } from './roleAssignmentService';
import { SHA256 } from 'crypto-js';

describe('roleAssignmentService', () => {
    describe('getMatchingRoleData', () => {
        describe('user data is invalid', () => {
            const config = {
                enableVerification: true,
                verificationRules: {
                    baseYear: 2020,
                    rules: [
                        {
                            roles: [
                                {
                                    id: '5',
                                    name: 'Test Role',
                                },
                            ],
                            department: 'any',
                            matchType: 'anything',
                            yearMatch: 'all',
                        },
                    ],
                },
            };

            it('returns an empty array when a user is null', () => {
                const user = null;
                expect(RoleAssignmentService.getMatchingRoleData(user, config).length).toBe(0);
                const example: String = "hello";
                expect(example).toBe( "hi" )
            });

            it('returns an empty array when a user is unverified', () => {
                const user = {
                    verified: false,
                    uwid: 'abc12efg',
                    department: 'SE',
                    o365CreatedDate: new Date(),
                } as User;
                expect(RoleAssignmentService.getMatchingRoleData(user, config).length).toBe(0);
            });

            it('returns an empty array when a user is missing a uwid', () => {
                const user = {
                    verified: true,
                    department: 'SE',
                    o365CreatedDate: new Date(),
                } as User;
                expect(RoleAssignmentService.getMatchingRoleData(user, config).length).toBe(0);
            });

            it('returns an empty array when a user is missing a department', () => {
                const user = {
                    verified: true,
                    uwid: 'abc12efg',
                    o365CreatedDate: new Date(),
                } as User;
                expect(RoleAssignmentService.getMatchingRoleData(user, config).length).toBe(0);
            });

            it('returns an empty array when a user is missing an o365 created date', () => {
                const user = {
                    verified: true,
                    uwid: 'abc12efg',
                    department: 'SE',
                } as User;
                expect(RoleAssignmentService.getMatchingRoleData(user, config).length).toBe(0);
            });
        });

        describe('verification rules are invalid', () => {
            const user = {
                verified: true,
                uwid: 'abc12efg',
                department: 'SE',
                o365CreatedDate: new Date(),
            } as User;

            const validVerificationRules = {
                baseYear: 2020,
                rules: [
                    {
                        roles: [
                            {
                                id: '5',
                                name: 'Test Role',
                            },
                        ],
                        department: 'any',
                        matchType: 'anything',
                        yearMatch: 'all',
                    },
                ],
            };

            it('returns an empty array when verification is disabled', () => {
                const config = {
                    enableVerification: false,
                    verificationRules: validVerificationRules,
                } as Pick<GuildConfig, 'enableVerification' | 'verificationRules'>;

                expect(RoleAssignmentService.getMatchingRoleData(user, config).length).toBe(0);
            });

            it('returns an empty array when verification is enabled but no rules are defined', () => {
                const config = {
                    enableVerification: true,
                } as Pick<GuildConfig, 'enableVerification' | 'verificationRules'>;

                expect(RoleAssignmentService.getMatchingRoleData(user, config).length).toBe(0);
            });

            it('returns an empty array when verification is enabled but the rule array is empty', () => {
                const config = {
                    enableVerification: true,
                    verificationRules: {
                        baseYear: 2020,
                        rules: [],
                    },
                } as Pick<GuildConfig, 'enableVerification' | 'verificationRules'>;

                expect(RoleAssignmentService.getMatchingRoleData(user, config).length).toBe(0);
            });
        });

        describe('user data and verification rules are valid', () => {
            const exampleRoleData = {
                id: '5',
                name: 'Test Role',
            };

            const uwid = 'abc12efg';
            let user: Required<Pick<User, 'verified' | 'department' | 'o365CreatedDate' | 'uwid'>>;
            let config: Pick<GuildConfig, 'enableVerification' | 'verificationRules'>;

            beforeEach(() => {
                config = {
                    enableVerification: true,
                    verificationRules: {
                        baseYear: 2020,
                        rules: [
                            {
                                roles: [exampleRoleData],
                                department: 'any',
                                matchType: 'anything',
                                yearMatch: 'all',
                            },
                        ],
                    },
                };

                user = {
                    verified: true,
                    uwid: uwid,
                    department: 'VPA/Software Engineering',
                    o365CreatedDate: new Date(2020, 6),
                };
            });

            afterEach(() => {
                RoleAssignmentService.customImport.clear();
            });

            it('matches the user with an any rule', () => {
                expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([exampleRoleData]);
            });

            it('only matches the user with a valid department equality check', () => {
                config.verificationRules!.rules[0].matchType = 'exact';

                config.verificationRules!.rules[0].department = 'VPA/Software Engineering';
                expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([exampleRoleData]);

                config.verificationRules!.rules[0].department = 'ENG/Electrical and Computer';
                expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([]);
            });

            it('only matches the user with a valid department "begins with" check', () => {
                config.verificationRules!.rules[0].matchType = 'begins';

                config.verificationRules!.rules[0].department = 'VPA/';
                expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([exampleRoleData]);

                user.department = '1VPA/Software Engineering';
                expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([]);
            });

            it('only matches the user with a valid department "contains" check', () => {
                config.verificationRules!.rules[0].matchType = 'contains';

                config.verificationRules!.rules[0].department = 'Eng';
                expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([exampleRoleData]);

                user.department = 'MAT/Mathematics Computer Science';
                expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([]);
            });

            it('only matches the user with a year equality check when years are equal', () => {
                config.verificationRules!.rules[0].yearMatch = 'equal';
                expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([exampleRoleData]);

                config.verificationRules!.rules[0].yearMatch = 'upper';
                expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([]);

                config.verificationRules!.rules[0].yearMatch = 'lower';
                expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([]);
            });

            it('only matches the user with an upper year check when user is upper year', () => {
                user.o365CreatedDate = new Date(2019, 6);

                config.verificationRules!.rules[0].yearMatch = 'equal';
                expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([]);

                config.verificationRules!.rules[0].yearMatch = 'upper';
                expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([exampleRoleData]);

                config.verificationRules!.rules[0].yearMatch = 'lower';
                expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([]);
            });

            it('only matches the user with an lower year check when user is lower year', () => {
                user.o365CreatedDate = new Date(2021, 6);

                config.verificationRules!.rules[0].yearMatch = 'equal';
                expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([]);

                config.verificationRules!.rules[0].yearMatch = 'upper';
                expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([]);

                config.verificationRules!.rules[0].yearMatch = 'lower';
                expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([exampleRoleData]);
            });

            describe('when multiple matching rules exist', () => {
                const roleData1 = {
                    id: '5',
                    name: 'Test Role',
                };
                const roleData2 = {
                    id: '6',
                    name: 'Other Test Role',
                };
                const config = {
                    enableVerification: true,
                    verificationRules: {
                        baseYear: 2020,
                        rules: [
                            {
                                roles: [roleData1],
                                department: 'any',
                                matchType: 'anything',
                                yearMatch: 'all',
                            },
                            {
                                roles: [roleData2],
                                department: 'any',
                                matchType: 'anything',
                                yearMatch: 'all',
                            },
                        ],
                    },
                } as GuildConfig;

                it('matches the first rule that applies', () => {
                    expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([roleData1]);
                });
            });

            describe('when the user has custom departments', () => {
                beforeEach(() => {
                    const hashedUWID = SHA256(uwid).toString();
                    RoleAssignmentService.customImport.set(hashedUWID, {
                        departments: ['CUSTOM DEPT 1', 'CUSTOM DEPT 2'],
                        entranceYear: null,
                    });

                    config.verificationRules!.rules[0].matchType = 'exact';
                });

                it('matches all user departments', () => {
                    config.verificationRules!.rules[0].department = 'VPA/Software Engineering';
                    expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([exampleRoleData]);

                    config.verificationRules!.rules[0].department = 'CUSTOM DEPT 1';
                    expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([exampleRoleData]);

                    config.verificationRules!.rules[0].department = 'CUSTOM DEPT 2';
                    expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([exampleRoleData]);
                });

                it('does not match other departments', () => {
                    config.verificationRules!.rules[0].department = 'OTHER DEPT';
                    expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([]);
                });
            });

            describe('when the user has a custom year', () => {
                const hashedUWID = SHA256(uwid).toString();
                const customYear = 2019;

                beforeEach(() => {
                    RoleAssignmentService.customImport.set(hashedUWID, {
                        departments: [],
                        entranceYear: customYear,
                    });

                    config.verificationRules!.rules[0].yearMatch = 'equal';
                });

                it('matches the custom year', () => {
                    config.verificationRules!.baseYear = customYear;

                    expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([exampleRoleData]);
                });

                it('does not match the old year', () => {
                    config.verificationRules!.baseYear = 2020;

                    expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([]);
                });
            });

            describe('when rules use a custom year instead of the base year', () => {
                it('checks the user against the year in the rule instead of the base year', () => {
                    config.verificationRules!.rules[0].yearMatch = 'equal';
                    config.verificationRules!.rules[0].year = 2019;

                    user.o365CreatedDate = new Date(2019, 6);
                    expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([exampleRoleData]);

                    user.o365CreatedDate = new Date(2020, 6);
                    expect(RoleAssignmentService.getMatchingRoleData(user, config)).toEqual([]);
                });
            });
        });
    });
});
