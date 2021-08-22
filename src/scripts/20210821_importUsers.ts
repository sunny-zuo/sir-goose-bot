/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import fs from 'fs';
import UserModel from '../models/user.model';

export async function importUsers(): Promise<void> {
    const importLocation = path.join(process.cwd(), 'src', 'data', 'scripts', '20210821_users.json');
    const importedUsers = JSON.parse(fs.readFileSync(importLocation, 'utf8'));

    const newUsers: any[] = [];
    for (const importedUser of importedUsers) {
        const user = {
            discordId: importedUser.discordId,
            verified: true,
            uwid: importedUser.uwid,
            givenName: importedUser.givenName,
            surname: importedUser.surname,
            department: importedUser.department,
            o365CreatedDate: new Date(importedUser.o365CreatedDate),
            refreshToken: importedUser.refreshToken,
            verifiedAt: new Date(importedUser.updatedAt),
        };

        Object.keys(user).forEach((key) => (user as any)[key] == undefined && delete (user as any)[key]);
        newUsers.push(user);
    }

    await UserModel.insertMany(newUsers);
}
