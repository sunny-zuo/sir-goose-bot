import { Message, User, CommandInteraction } from 'discord.js';
import { isMessage } from './message';

export function getUser(interaction: Message | CommandInteraction): User {
    return isMessage(interaction) ? interaction.author : interaction.user;
}
