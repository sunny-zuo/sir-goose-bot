import { Message, Interaction, User } from 'discord.js';
import { isMessage } from './message';

export function getUser(interaction: Message | Interaction): User {
    return isMessage(interaction) ? interaction.author : interaction.user;
}
