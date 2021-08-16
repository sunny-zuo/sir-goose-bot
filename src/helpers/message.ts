import { Message, CommandInteraction, InteractionReplyOptions, ReplyMessageOptions, ButtonInteraction } from 'discord.js';

export function sendReply(
    interaction: Message | CommandInteraction | ButtonInteraction,
    message: InteractionReplyOptions | ReplyMessageOptions
): void {
    // this is dumb but it fixes a typescript error when replying to any of 3 interaction types ¯\_(ツ)_/¯
    if (isMessage(interaction)) {
        interaction.reply(message);
    } else {
        interaction.reply(message);
    }
}

export function sendEphemeralReply(
    interaction: Message | CommandInteraction | ButtonInteraction,
    message: InteractionReplyOptions | ReplyMessageOptions,
    deletionSeconds = 30
): void {
    if (isMessage(interaction)) {
        interaction.reply(message).then((sentMessage) => {
            setTimeout(() => sentMessage.delete(), deletionSeconds * 1000);
        });
    } else {
        interaction.reply({ ...message, ephemeral: true });
    }
}

function isMessage(interaction: Message | CommandInteraction | ButtonInteraction): interaction is Message {
    return (interaction as Message).url !== undefined;
}
