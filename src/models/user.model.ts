import { Snowflake } from 'discord.js';
import { Schema, model } from 'mongoose';

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

export default UserModel;
