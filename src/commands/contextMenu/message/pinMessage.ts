import { ContextMenuInteraction, Message, MessageEmbed, Permissions } from 'discord.js';
import Client from '#src/Client';
import { GuildConfigCache } from '#util/guildConfigCache';
import { Modlog } from '#util/modlog';
import { ContextMenuCommand } from '../ContextMenuCommand';
import { inlineCode } from '@discordjs/builders';
import { attemptPin } from '#util/pin';

export class PinMessage extends ContextMenuCommand {
    constructor(client: Client) {
        super(client, {
            name: 'Pin Message',
            description: 'Context menu pin command',
            category: 'Message',
            guildOnly: true,
            clientPermissions: [Permissions.FLAGS.MANAGE_MESSAGES],
            cooldownSeconds: 60,
            cooldownMaxUses: 2,
        });
    }

    async execute(interaction: ContextMenuInteraction): Promise<void> {
        const message = interaction.options.getMessage('message') as Message;
        if (!message) return;

        const config = await GuildConfigCache.fetchConfig(interaction.guild!.id);

        if (!config.enablePins) {
            await this.sendErrorEmbed(
                interaction,
                'Pinning Disabled',
                `The pin command is not enabled on this server. If you have server moderation permissions, use ${inlineCode(
                    '/config'
                )} to enable pins.`,
                true
            );
            return;
        }

        const pinResult = await attemptPin(message);

        if (pinResult.success) {
            this.client.log.info(
                `${this.getUser(interaction).tag} pinned message with id ${message.id} in server ${interaction.guild} (${
                    interaction.guildId
                }) using the pin context menu command in channel ${message.channel.id}.`
            );

            await Modlog.logUserAction(
                this.client,
                interaction.guild,
                this.getUser(interaction),
                `${interaction.member} pinned [a message](${message.url}) using the pin command in ${message.channel}.`,
                'BLUE'
            );

            await interaction.reply({
                embeds: [new MessageEmbed().setDescription('Message Successfully Pinned').setColor('GREEN')],
                ephemeral: true,
            });
        } else {
            let errorDescription;

            switch (pinResult.error) {
                case 'ALREADY_PINNED':
                    errorDescription = 'The message is already pinned.';
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
                    this.client.log.error(pinResult.error);
                    errorDescription = 'We ran into an unknown error trying to pin this message.';
            }

            const embed = new MessageEmbed().setDescription(errorDescription).setColor('RED');
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}
