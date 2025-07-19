import {
    Message,
    CommandInteraction,
    InteractionReplyOptions,
    ButtonInteraction,
    MessageContextMenuCommandInteraction,
    MessageReplyOptions,
    DiscordAPIError,
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
    interaction: Message | CommandInteraction | ButtonInteraction | MessageContextMenuCommandInteraction,
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
    interaction: Message | CommandInteraction | ButtonInteraction | MessageContextMenuCommandInteraction
): interaction is Message {
    return (interaction as Message).author !== undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function catchUnknownMessage(e: any) {
    if (e instanceof DiscordAPIError && e.message === 'Unknown Message') {
        // do nothing if we get an "Unknown Message", this is probably caused by the message
        // being deleted by the user so it doesn't matter that the edit failed
    } else {
        throw e;
    }
}
