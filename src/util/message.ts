import {
    Message,
    CommandInteraction,
    InteractionReplyOptions,
    ButtonInteraction,
    UserContextMenuCommandInteraction,
    MessageReplyOptions,
} from 'discord.js';

export async function sendReply(
    interaction: Message | CommandInteraction | ButtonInteraction,
    message: InteractionReplyOptions & MessageReplyOptions,
    isDeferred = false
): Promise<void> {
    if (isMessage(interaction)) {
        await interaction.reply(message);
    } else if (isDeferred) {
        await interaction.editReply(message);
    } else {
        await interaction.reply(message);
    }
}

export async function sendEphemeralReply(
    interaction: Message | CommandInteraction | ButtonInteraction | UserContextMenuCommandInteraction,
    message: InteractionReplyOptions & MessageReplyOptions,
    deletionSeconds = 30,
    isDeferred = false
): Promise<void> {
    if (isMessage(interaction)) {
        await interaction.reply(message).then((sentMessage) => {
            setTimeout(async () => {
                // we ignore the delete error as it isn't something we can feasibly handle
                await sentMessage.delete().catch(() => undefined);
            }, deletionSeconds * 1000);
        });
    } else if (isDeferred) {
        await interaction.editReply(message);
    } else {
        await interaction.reply({ ...message, ephemeral: true });
    }
}

export function isMessage(
    interaction: Message | CommandInteraction | ButtonInteraction | UserContextMenuCommandInteraction
): interaction is Message {
    return (interaction as Message).author !== undefined;
}
