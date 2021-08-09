import { Command } from '../Command';
import Client from '../../Client';
import {
    ApplicationCommandOption,
    CommandInteraction,
    TextBasedChannels,
    Message,
    MessageEmbed,
    Permissions,
    Snowflake,
    CommandInteractionOptionResolver,
} from 'discord.js';
import { GuildConfigCache } from '../../helpers/guildConfigCache';
import { Modlog } from '../../helpers/modlog';

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
            cooldownSeconds: 60,
            cooldownMaxUses: 2,
        });
    }

    async execute(interaction: Message | CommandInteraction, args?: CommandInteractionOptionResolver): Promise<void> {
        const config = await GuildConfigCache.fetchConfig(interaction.guild!.id);
        if (!config.enablePins) {
            this.sendErrorEmbed(
                interaction,
                'Pinning Disabled',
                `The pin command is not enabled on a server. If you have server moderation permissions, use \`${config.prefix}config enable_pins true\` to enable pins.`
            );
            return;
        }

        let channel: TextBasedChannels | undefined;
        let pinMessageId: Snowflake | undefined | null;

        if (this.isMessage(interaction)) {
            pinMessageId = (args?.getString('message_id') as Snowflake) || interaction.reference?.messageId;
            channel = interaction.channel;
        } else {
            pinMessageId = args?.getString('message_id') as Snowflake;
            const fetchedChannel = interaction.channel ?? (await interaction.guild?.channels.fetch(interaction?.channelId));
            if (fetchedChannel?.type === 'GUILD_TEXT') {
                channel = fetchedChannel;
            }
        }

        if (!channel || !channel.isText()) return;
        if (!pinMessageId) {
            this.sendErrorEmbed(
                interaction,
                'Pin Error',
                'You did not provide a message to pin. Either reply to the message you want to quote, or supply the message id and use the command in the same channel as the message you want to pin.'
            );
            return;
        }

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

        await Modlog.logUserAction(
            this.client,
            interaction.guild,
            this.isMessage(interaction) ? interaction.author : interaction.user,
            `${interaction.member} pinned [a message](${pinMessage.url}) using the pin command in ${pinMessage.channel}.`,
            'BLUE'
        );
    }
}
