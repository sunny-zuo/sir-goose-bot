import {
    Message,
    CommandInteraction,
    InteractionReplyOptions,
    ReplyMessageOptions,
    ButtonInteraction,
    ContextMenuInteraction,
} from 'discord.js';

export function sendReply(
    interaction: Message | CommandInteraction | ButtonInteraction,
    message: InteractionReplyOptions | ReplyMessageOptions
): Promise<void | Message> {
    // this is dumb but it fixes a typescript error when replying to any of 3 interaction types ¯\_(ツ)_/¯
    if (isMessage(interaction)) {
        return interaction.reply(message);
    } else {
        return interaction.reply(message);
    }
}

export function sendEphemeralReply(
    interaction: Message | CommandInteraction | ButtonInteraction | ContextMenuInteraction,
    message: InteractionReplyOptions | ReplyMessageOptions,
    deletionSeconds = 30
): Promise<void> {
    if (isMessage(interaction)) {
        return interaction.reply(message).then((sentMessage) => {
            setTimeout(async () => {
                // we ignore the delete error as it isn't something we can feasibly handle
                await sentMessage.delete().catch();
            }, deletionSeconds * 1000);
        });
    } else {
        return interaction.reply({ ...message, ephemeral: true });
    }
}

function isMessage(interaction: Message | CommandInteraction | ButtonInteraction | ContextMenuInteraction): interaction is Message {
    return (interaction as Message).url !== undefined;
}
