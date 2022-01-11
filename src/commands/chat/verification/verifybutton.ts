import {
    Message,
    CommandInteraction,
    Permissions,
    MessageActionRow,
    MessageButton,
    ApplicationCommandOption,
    CommandInteractionOptionResolver,
} from 'discord.js';
import { ChatCommand } from '../ChatCommand';
import Client from '../../../Client';

export class VerifyButton extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'message',
            description: 'The message to include with the verification button',
            type: 'STRING',
        },
        {
            name: 'show_learn_more',
            description: 'Whether or not to show a learn more button',
            type: 'BOOLEAN',
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

    async execute(
        interaction: Message | CommandInteraction,
        args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const components = new MessageActionRow().addComponents(
            new MessageButton().setCustomId('requestVerificationLink').setLabel('Request Verification Link').setStyle('PRIMARY')
        );

        if (args?.getBoolean('show_learn_more')) {
            components.addComponents(new MessageButton().setCustomId('verificationLearnMore').setLabel('Learn More').setStyle('SECONDARY'));
        }

        const content = args?.getString('message') ?? 'Click the button below to request a verification link!';

        if (this.isMessage(interaction)) {
            await interaction.channel.send({ content: content, components: [components] });
        } else {
            const channel = interaction.channel ?? (await interaction.guild?.channels.fetch(interaction.channelId));
            if (!channel?.isText()) return;

            await channel.send({ content: content, components: [components] });
            await interaction.reply({ content: 'Verification button successfully created!', ephemeral: true });
        }
    }
}
