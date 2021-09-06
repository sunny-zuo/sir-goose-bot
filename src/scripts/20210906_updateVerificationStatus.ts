import UserModel from '../models/user.model';

export async function updateVerificationStatus(): Promise<void> {
    const update = await UserModel.updateMany(
        { $or: [{ givenName: undefined }, { department: undefined }, { o365CreatedDate: undefined }] },
        { verified: false }
    );

    console.log(`Updated ${update.nModified} documents.`);
}
