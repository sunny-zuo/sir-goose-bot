import { Message } from 'discord.js';
import { Result } from '../types';

export type PinError = 'SYSTEM_MESSAGE' | 'CHANNEL_NOT_VIEWABLE' | 'ALREADY_PINNED' | 'MISSING_PERMISSIONS';

export async function attemptPin(message: Message): Promise<Result<null, PinError>> {
    const { channel, system } = message;

    if (system) return { success: false, error: 'SYSTEM_MESSAGE' };
    else if (channel.type === 'DM') return pin(message);
    else if (!channel.viewable) return { success: false, error: 'CHANNEL_NOT_VIEWABLE' };
    else if (!channel.permissionsFor(message.client.user!)?.has('MANAGE_MESSAGES')) return { success: false, error: 'MISSING_PERMISSIONS' };
    else if (message.pinned) return { success: false, error: 'ALREADY_PINNED' };
    else return pin(message);
}

async function pin(message: Message): Promise<Result<null, PinError>> {
    try {
        await message.pin();
        return { success: true, value: null };
    } catch (e) {
        return { success: false, error: e.message };
    }
}