import { ContextMenuInteraction, Message, MessageEmbed, Permissions } from 'discord.js';
import Client from '#src/Client';
import { GuildConfigCache } from '#util/guildConfigCache';
import { Modlog } from '#util/modlog';
import { ContextMenuCommand } from '../ContextMenuCommand';

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
                `The pin command is not enabled on a server. If you have server moderation permissions, use \`${config.prefix}config enable_pins true\` to enable pins.`,
                true
            );
            return;
        }

        if (message.pinned) {
            await this.sendErrorEmbed(interaction, 'Pin Error', 'This message is already pinned.', true);
            return;
        }

        await message.pin();

        await Modlog.logUserAction(
            this.client,
            interaction.guild,
            this.getUser(interaction),
            `${interaction.member} pinned [a message](${message.url}) using the pin command in ${message.channel}.`,
            'BLUE'
        );

        this.client.log.info(
            `${this.getUser(interaction).tag} pinned message with id ${message.id} in server ${interaction.guild} (${
                interaction.guildId
            }) using the pin context menu command in channel ${message.channel.id}.`
        );

        await interaction.reply({
            embeds: [new MessageEmbed().setTitle('Message Successfully Pinned').setColor('GREEN')],
            ephemeral: true,
        });
    }
}
