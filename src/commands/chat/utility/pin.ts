import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import {
    ApplicationCommandOption,
    CommandInteraction,
    Message,
    MessageEmbed,
    Permissions,
    Snowflake,
    CommandInteractionOptionResolver,
    Channel,
} from 'discord.js';
import { GuildConfigCache } from '#util/guildConfigCache';
import { Modlog } from '#util/modlog';
import { inlineCode } from '@discordjs/builders';
import { attemptPin } from '#util/pin';
import { sendEphemeralReply } from '#util/message';
import { logger } from '#util/logger';

export class Pin extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'message_id',
            description: 'The id of the message to pin.',
            type: 'STRING',
        },
    ];
    constructor(client: Client) {
        super(client, {
            name: 'pin',
            description: 'Pin the message you replied to or by message id.',
            category: 'Utility',
            options: Pin.options,
            guildOnly: true,
            clientPermissions: [Permissions.FLAGS.MANAGE_MESSAGES],
            cooldownSeconds: 60,
            cooldownMaxUses: 2,
        });
    }

    async execute(
        interaction: Message | CommandInteraction,
        args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const config = await GuildConfigCache.fetchConfig(interaction.guild!.id);
        if (!config.enablePins) {
            await this.sendErrorEmbed(
                interaction,
                'Pinning Disabled',
                `The pin command is not enabled on this server. If you have server moderation permissions, use ${inlineCode(
                    '/config'
                )} to enable pins.`
            );
            return;
        }

        let channel: Channel | undefined;
        let pinMessageId: Snowflake | undefined | null;

        if (this.isMessage(interaction)) {
            pinMessageId = (args?.getString('message_id') as Snowflake) || interaction.reference?.messageId;
            if (interaction.channel.partial) {
                channel = await interaction.channel.fetch().catch(() => undefined);
            } else {
                channel = interaction.channel;
            }
        } else {
            pinMessageId = args?.getString('message_id') as Snowflake;
            const fetchedChannel =
                interaction.channel ?? (await interaction.guild?.channels.fetch(interaction?.channelId).catch(() => null));
            if (fetchedChannel?.type === 'GUILD_TEXT') {
                channel = fetchedChannel;
            }
        }

        if (!channel || !channel.isText()) return;
        if (!pinMessageId) {
            await this.sendErrorEmbed(
                interaction,
                'Pin Error',
                'You did not provide a message to pin. Either reply to the message you want to quote, or supply the message id and use the command in the same channel as the message you want to pin.'
            );
            return;
        }

        let pinMessage: Message | undefined;

        try {
            pinMessage = await channel.messages.fetch(pinMessageId);
        } catch (e) {
            await this.sendErrorEmbed(
                interaction,
                'Pin Error',
                'You did not provide a valid message to pin. Either reply to the message you want to quote, or supply the message id and use the command in the same channel as the message you want to pin.'
            );
            return;
        }

        const pinResult = await attemptPin(pinMessage, `Pinned by ${this.getUser(interaction).tag} (${this.getUser(interaction).id})`);

        logger.info({
            pin: { messageId: pinMessageId, source: 'message' },
            guild: { id: interaction.guild?.id ?? 'none' },
            user: { id: this.getUser(interaction).id },
        });

        if (pinResult.success) {
            if (!this.isMessage(interaction)) {
                await interaction.reply({
                    embeds: [new MessageEmbed().setTitle('Message Successfully Pinned').setColor('GREEN')],
                    ephemeral: true,
                });

                await Modlog.logUserAction(
                    this.client,
                    interaction.guild,
                    this.getUser(interaction),
                    `${interaction.member} pinned [a message](${pinMessage.url}) using the pin command in ${pinMessage.channel}.`,
                    'BLUE'
                );
            }
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
                    logger.error(pinResult.error);
                    errorDescription = 'We ran into an unknown error trying to pin this message.';
            }

            const embed = new MessageEmbed().setDescription(errorDescription).setColor('RED');

            await sendEphemeralReply(interaction, { embeds: [embed] });
        }
    }
}
