import {
    Message,
    CommandInteraction,
    Permissions,
    MessageActionRow,
    MessageButton,
    ApplicationCommandOption,
    Collection,
    CommandInteractionOption,
} from 'discord.js';
import { Command } from '../Command';
import Client from '../../Client';

export class VerifyButton extends Command {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'message',
            description: 'The message to include with the verification button',
            type: 'STRING',
        },
    ];
    constructor(client: Client) {
        super(client, {
            name: 'verifybutton',
            description: 'Create a button that users can press to request a verification link',
            category: 'Verification',
            options: VerifyButton.options,
            guildOnly: true,
            userPermissions: [Permissions.FLAGS.MANAGE_GUILD],
        });
    }

    async execute(interaction: Message | CommandInteraction, args?: Collection<string, CommandInteractionOption>): Promise<void> {
        const button = new MessageActionRow().addComponents(
            new MessageButton().setCustomId('requestVerificationLink').setLabel('Request Verification Link').setStyle('PRIMARY')
        );

        const content = (args?.get('message')?.value as string) ?? 'Click the button below to request a verification link!';

        if (this.isMessage(interaction)) {
            interaction.channel.send({ content: content, components: [button] });
        } else {
            const channel = interaction.channel ?? (await interaction.guild?.channels.fetch(interaction.channelId));
            if (!channel?.isText()) return;

            channel.send({ content: content, components: [button] });
            interaction.reply({ content: 'Verification button successfully created!', ephemeral: true });
        }
    }
}
