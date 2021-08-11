/**
 * Returns an iterator for the given array split into chunks of a given size.
 */
export function* chunk<T>(array: T[], size: number): IterableIterator<T[]> {
    if (size <= 0) {
        return;
    }
    for (let i = 0; i < array.length; i += size) {
        yield array.slice(i, i + size);
    }
}
