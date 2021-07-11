import { Schema, model } from 'mongoose';

interface User {
    discordId: string;
    verified: boolean;
    uwid: string;
    givenName: string;
    surname: string;
    department: string;
    o365CreatedDate: Date;
    refreshToken: string;
    verifiedAt: Date;
    verifiedClickedAt: Date;
}

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
        verifiedAt: Date,
        verifiedClickedAt: Date,
    },
    {
        timestamps: true,
    }
);

const UserModel = model<User>('User', schema);

export default UserModel;
