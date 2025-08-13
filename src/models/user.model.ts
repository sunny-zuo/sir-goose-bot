import { Snowflake } from 'discord.js';
import { FilterQuery, Schema, model } from 'mongoose';
import VerificationOverrideModel, { OverrideScope, VerificationOverride } from './verificationOverride.model';

export interface User {
    discordId: string;
    verified: boolean;
    uwid?: string;
    givenName?: string;
    surname?: string;
    department?: string;
    o365CreatedDate?: Date;
    refreshToken?: string;
    verifyRequestedAt?: Date;
    verifyRequestedServerId?: Snowflake;
    verifiedAt?: Date;
    verifiedClickedAt?: Date;
}

// specific fields required for user verification to be processed
export type UserRequiredForVerification = Pick<User, 'verified' | 'department' | 'o365CreatedDate' | 'uwid'>;

const schema = new Schema<User>(
    {
        discordId: { type: String, required: true },
        verified: { type: Boolean, required: true },
        uwid: String,
        givenName: String,
        surname: String,
        department: String,
        o365CreatedDate: Date,
        refreshToken: String,
        verifyRequestedAt: Date,
        verifyRequestedServerId: String,
        verifiedAt: Date,
        verifiedClickedAt: Date,
    },
    {
        timestamps: true,
    }
);

const UserModel = model<User>('User', schema);

/**
 * Finds the user's verification data, applying any overrides that exist.
 * @param discordId the user's discord id
 * @param guildId the guild id to check for overrides
 * @returns the user's verification data, after any applicable overrides
 */
export async function findUserVerificationData(discordId: string, guildId?: string): Promise<UserRequiredForVerification> {
    const user = await UserModel.findOne({ discordId }).lean();

    // always query for global overrides and check for guild overrides if a guildId is provided
    const queryConditions: FilterQuery<VerificationOverride>[] = [{ scope: OverrideScope.GLOBAL }];
    if (guildId) {
        queryConditions.push({ guildId: guildId, scope: OverrideScope.GUILD });
    }

    const overrides = await VerificationOverrideModel.find({
        discordId: discordId,
        $or: queryConditions,
        deleted: { $exists: false },
    })
        .sort({ createdAt: -1 }) // sort by creation date, newest first
        .lean();

    // find the most recent guild override, or fall back to most recent global override
    const guildOverride = overrides.find((o) => o.scope === OverrideScope.GUILD);
    const globalOverride = overrides.find((o) => o.scope === OverrideScope.GLOBAL);
    const overrideToApply = guildOverride ?? globalOverride;

    // if both overrides exist with the guild override being incomplete, attempt to fill missing data from global override
    if (guildOverride && globalOverride && overrideToApply) {
        if (!guildOverride.department) overrideToApply.department = globalOverride.department;
        if (!guildOverride.o365CreatedDate) overrideToApply.o365CreatedDate = globalOverride.o365CreatedDate;
    }

    // create a result combining the user info and any overrides that exist
    const result: UserRequiredForVerification = {
        verified: user?.verified || false,
        department: overrideToApply?.department || user?.department,
        o365CreatedDate: overrideToApply?.o365CreatedDate || user?.o365CreatedDate,
        uwid: user?.uwid || 'find-verification-data',
    };

    // if we have override data that makes the user complete, mark as verified
    if (overrideToApply?.department && overrideToApply?.o365CreatedDate) result.verified = true;

    return result;
}

export default UserModel;
