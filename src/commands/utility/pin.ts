import { Command } from '../Command';
import Client from '../../Client';
import {
    ApplicationCommandOption,
    Channel,
    Collection,
    CommandInteraction,
    CommandInteractionOption,
    Message,
    MessageEmbed,
    Permissions,
    Snowflake,
} from 'discord.js';
import { GuildConfigCache } from '../../helpers/guildConfigCache';

export class Pin extends Command {
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
        });
    }

    async execute(interaction: Message | CommandInteraction, args?: Collection<string, CommandInteractionOption>): Promise<void> {
        const config = await GuildConfigCache.fetchConfig(interaction.guild!.id);
        if (!config.enablePins) {
            this.sendErrorEmbed(
                interaction,
                'Pinning Disabled',
                `The pin command is not enabled on a server. If you have server moderation permissions, use \`${config.prefix}config enable_pins true\` to enable pins.`
            );
            return;
        }

        let channel: Channel | undefined | null;
        let pinMessageId: Snowflake | undefined;

        if (this.isMessage(interaction)) {
            pinMessageId = (args?.get('message_id')?.value as Snowflake) || interaction.reference?.messageId;
            channel = interaction.channel;
        } else {
            pinMessageId = args?.get('message_id')?.value as Snowflake;
            channel = interaction.channel ?? (await interaction.guild?.channels.fetch(interaction?.channelId));
        }

        if (!channel || !channel.isText()) return;

        let pinMessage: Message | undefined;

        try {
            pinMessage = await channel.messages.fetch(pinMessageId);

            if (!pinMessageId || !pinMessage) {
                this.sendErrorEmbed(
                    interaction,
                    'Pin Error',
                    'You did not provide a message to pin. Either reply to the message you want to quote, or supply the message id and use the command in the same channel as the message you want to pin.'
                );
                return;
            }
        } catch (e) {
            this.sendErrorEmbed(
                interaction,
                'Pin Error',
                'You did not provide a message to pin. Either reply to the message you want to quote, or supply the message id and use the command in the same channel as the message you want to pin.'
            );
            return;
        }

        if (pinMessage.pinned) {
            this.sendErrorEmbed(interaction, 'Pin Error', 'This message is already pinned.');
            return;
        }

        await pinMessage.pin();

        if (!this.isMessage(interaction)) {
            interaction.reply({ embeds: [new MessageEmbed().setTitle('Message Successfully Pinned').setColor('GREEN')], ephemeral: true });
        }
    }
}
