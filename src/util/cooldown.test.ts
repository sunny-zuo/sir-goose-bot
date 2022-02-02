import { Cooldown } from './cooldown';
import { Snowflake } from 'discord.js';

describe('cooldown', () => {
    describe('checkLimit', () => {
        jest.useFakeTimers();

        describe('cooldown with a single use', () => {
            const cooldownSeconds = 50; // in seconds
            const user1 = '1234' as Snowflake;
            let cooldown: Cooldown;

            beforeEach(() => {
                jest.spyOn(global, 'setTimeout');
                Date.now = jest.fn(() => 1628130000000);
                cooldown = new Cooldown(cooldownSeconds);
            });

            afterEach(() => {
                jest.clearAllMocks();
            });

            it('should allow a new user to pass', () => {
                expect(cooldown.checkLimit(user1)).toEqual({ blocked: false });
            });

            it('should allow a new user on the first attempt and block for the cooldown duration', () => {
                expect(cooldown.checkLimit(user1)).toEqual({ blocked: false });
                expect(cooldown.checkLimit(user1)).toEqual({ blocked: true, secondsUntilReset: cooldownSeconds });
            });

            it('should allow a user to pass after the cooldown is over', () => {
                cooldown.checkLimit(user1);
                Date.now = jest.fn(() => 1628130000000 + cooldownSeconds * 1000);
                expect(cooldown.checkLimit(user1)).toEqual({ blocked: false });
            });

            it('allows a second user to pass while a user is blocked', () => {
                const user2 = '567' as Snowflake;
                cooldown.checkLimit(user1);

                expect(cooldown.checkLimit(user1)).toEqual({ blocked: true, secondsUntilReset: cooldownSeconds });
                expect(cooldown.checkLimit(user2)).toEqual({ blocked: false });
            });

            it('sets a timer to delete the user from the collection after user is blocked', () => {
                expect(cooldown.checkLimit(user1)).toEqual({ blocked: false });
                expect(cooldown.checkLimit(user1)).toEqual({ blocked: true, secondsUntilReset: cooldownSeconds });

                expect(setTimeout).toHaveBeenCalledTimes(1);
                expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), cooldownSeconds * 1000);

                jest.runAllTimers();

                expect(cooldown.checkLimit(user1)).toEqual({ blocked: false });
            });
        });

        describe('cooldown with multiple uses before block', () => {
            const cooldownSeconds = 50; // in seconds
            const maxUses = 3;
            const user1 = '1234' as Snowflake;
            let cooldown: Cooldown;

            beforeEach(() => {
                jest.spyOn(global, 'setTimeout');
                Date.now = jest.fn(() => 1628130000000);
                cooldown = new Cooldown(cooldownSeconds, maxUses);
            });

            afterEach(() => {
                jest.clearAllMocks();
            });

            it('should allow a new user to pass up to maxUses times', () => {
                for (let i = 0; i < maxUses; i++) {
                    expect(cooldown.checkLimit(user1)).toEqual({ blocked: false });
                }
            });

            it('should block a user for the cooldown duration after 3 uses', () => {
                for (let i = 0; i < maxUses; i++) {
                    expect(cooldown.checkLimit(user1)).toEqual({ blocked: false });
                }
                expect(cooldown.checkLimit(user1)).toEqual({ blocked: true, secondsUntilReset: cooldownSeconds });
            });

            it('should allow a user to pass 3 times after the cooldown is over', () => {
                for (let i = 0; i < maxUses; i++) {
                    cooldown.checkLimit(user1);
                }

                expect(cooldown.checkLimit(user1)).toEqual({ blocked: true, secondsUntilReset: cooldownSeconds });

                Date.now = jest.fn(() => 1628130000000 + cooldownSeconds * 1000);

                for (let i = 0; i < maxUses; i++) {
                    expect(cooldown.checkLimit(user1)).toEqual({ blocked: false });
                }
            });

            it('should allow a second user to pass 3 times while a different user has existing uses', () => {
                const user2 = '567' as Snowflake;
                cooldown.checkLimit(user1);
                cooldown.checkLimit(user1);

                for (let i = 0; i < maxUses; i++) {
                    expect(cooldown.checkLimit(user2)).toEqual({ blocked: false });
                }

                expect(cooldown.checkLimit(user2)).toEqual({ blocked: true, secondsUntilReset: cooldownSeconds });
            });

            it('should allow a second user to pass 3 times while a different user is blocked', () => {
                const user2 = '567' as Snowflake;
                for (let i = 0; i < maxUses; i++) {
                    cooldown.checkLimit(user1);
                }

                expect(cooldown.checkLimit(user1)).toEqual({ blocked: true, secondsUntilReset: cooldownSeconds });
                expect(cooldown.checkLimit(user2)).toEqual({ blocked: false });
            });

            it('sets a timer to delete the user from the collection after user is blocked', () => {
                for (let i = 0; i < maxUses; i++) {
                    expect(cooldown.checkLimit(user1)).toEqual({ blocked: false });
                }
                expect(cooldown.checkLimit(user1)).toEqual({ blocked: true, secondsUntilReset: cooldownSeconds });

                expect(setTimeout).toHaveBeenCalledTimes(1);
                expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), cooldownSeconds * 1000);

                jest.runAllTimers();

                expect(cooldown.checkLimit(user1)).toEqual({ blocked: false });
            });

            it('expires uses that did not lead to being blocked after the cooldown has passed', () => {
                // consume 1 less than max uses to avoid going into a blocked state
                for (let i = 0; i < maxUses - 1; i++) {
                    expect(cooldown.checkLimit(user1)).toEqual({ blocked: false });
                }

                Date.now = jest.fn(() => 1628130000000 + cooldownSeconds * 1000);

                for (let i = 0; i < maxUses; i++) {
                    expect(cooldown.checkLimit(user1)).toEqual({ blocked: false });
                }
                expect(cooldown.checkLimit(user1)).toEqual({ blocked: true, secondsUntilReset: cooldownSeconds });
            });
        });
    });
});
