import { Guild, Snowflake, GuildMember, Collection } from 'discord.js';
import { logger } from './logger';

export async function safeFetchMember(guild: Guild, userId: Snowflake): Promise<GuildMember | null> {
    try {
        const member = await guild.members.fetch(userId);
        return member;
    } catch (e) {
        return null;
    }
}

export async function safeFetchMembers(guild: Guild, userIds: Snowflake[]): Promise<Collection<string, GuildMember> | null> {
    const digitRegex = /\D/g; // matches any character that isn't a digit
    const cleanIds = userIds.filter((userId) => !digitRegex.test(userId));
    if (cleanIds.length === 0) return null;

    try {
        const members = await guild.members.fetch({ user: cleanIds });
        return members;
    } catch (e) {
        logger.error(e);
        return null;
    }
}
