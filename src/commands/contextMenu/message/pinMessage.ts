import { EmbedBuilder, inlineCode, PermissionsBitField, MessageContextMenuCommandInteraction } from 'discord.js';
import Client from '#src/Client';
import { GuildConfigCache } from '#util/guildConfigCache';
import { Modlog } from '#util/modlog';
import { MessageContextMenuCommand } from './MessageContextMenuCommand';
import { attemptPin } from '#util/pin';
import { logger } from '#util/logger';

export class PinMessage extends MessageContextMenuCommand {
    constructor(client: Client) {
        super(client, {
            name: 'Pin Message',
            description: 'Context menu pin command',
            category: 'Message',
            guildOnly: true,
            clientPermissions: [PermissionsBitField.Flags.ManageMessages],
            cooldownSeconds: 60,
            cooldownMaxUses: 2,
        });
    }

    async execute(interaction: MessageContextMenuCommandInteraction): Promise<void> {
        const message = interaction.options.getMessage('message');
        if (!message) return;

        await interaction.deferReply({ ephemeral: true });

        const config = await GuildConfigCache.fetchConfig(interaction.guild!.id);
        if (!config.enablePins) {
            const embed = new EmbedBuilder()
                .setDescription(
                    `The pin command is not enabled on this server. If you have server moderation permissions, use ${inlineCode(
                        '/config'
                    )} to allow all users to pin messages.`
                )
                .setColor('Red');

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        const pinResult = await attemptPin(message, `Pinned by ${interaction.user.tag} (${interaction.user.id})`);

        logger.info({
            pin: { messageId: message.id, source: 'contextMenu' },
            guild: { id: interaction.guild?.id ?? 'none' },
            user: { id: interaction.user.id },
        });

        if (pinResult.success) {
            await Modlog.logUserAction(
                interaction.guild,
                this.getUser(interaction),
                `${interaction.member} pinned [a message](${message.url}) using the pin command in ${message.channel}.`,
                'Blue'
            );

            await interaction.editReply({
                embeds: [new EmbedBuilder().setDescription('Message Successfully Pinned').setColor('Green')],
            });
        } else {
            let errorDescription;

            switch (pinResult.error) {
                case 'ALREADY_PINNED':
                    errorDescription = 'The message is already pinned. Please ask a moderator if you would like to unpin a message.';
                    break;
                case 'CHANNEL_NOT_VIEWABLE':
                    errorDescription = 'I do not have access to view the channel containing the message you are trying to pin.';
                    break;
                case 'MISSING_PERMISSIONS':
                    errorDescription = 'I need the `Manage Messages` permission to pin this message.';
                    break;
                case 'SYSTEM_MESSAGE':
                    errorDescription = 'System messages (messages sent by Discord) cannot be pinned.';
                    break;
                default:
                    logger.error(pinResult.error);
                    errorDescription = 'We ran into an unknown error trying to pin this message.';
            }

            const embed = new EmbedBuilder().setDescription(errorDescription).setColor('Red');
            await interaction.editReply({ embeds: [embed] });
        }
    }
}
