import { RenameType } from '#types/Verification';

/**
 * Format a verified user's nickname based on the server's rename setting
 * @param user the user's UW given name and surname
 * @param renameType the server's configured rename type
 * @returns the formatted nickname, or undefined if no nickname should be set
 */
export function formatVerifiedNickname(user: { givenName?: string; surname?: string }, renameType?: string): string | undefined {
    const givenName = user.givenName?.trim();
    const surname = user.surname?.trim();
    if (!givenName) return undefined;

    const firstName = givenName.split(/\s+/)[0];

    switch (renameType) {
        case RenameType.FULL_NAME:
            return surname ? `${givenName} ${surname}` : givenName;
        case RenameType.FIRST_NAME:
            return firstName;
        case RenameType.FIRST_NAME_LAST_INITIAL:
            return surname ? `${firstName} ${surname.charAt(0).toUpperCase()}.` : firstName;
        default:
            return undefined;
    }
}
