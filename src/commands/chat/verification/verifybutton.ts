import {
    Message,
    CommandInteraction,
    PermissionsBitField,
    ActionRowBuilder,
    ButtonBuilder,
    ApplicationCommandOption,
    CommandInteractionOptionResolver,
    ChannelType,
    ApplicationCommandOptionType,
    ButtonStyle,
} from 'discord.js';
import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';

export class VerifyButton extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'message',
            description: 'The message to include with the verification button',
            type: ApplicationCommandOptionType.String,
        },
        {
            name: 'show_learn_more',
            description: 'Whether or not to show a learn more button',
            type: ApplicationCommandOptionType.Boolean,
        },
    ];
    constructor(client: Client) {
        super(client, {
            name: 'verifybutton',
            description: 'Create a button that users can press to request a verification link',
            category: 'Verification',
            options: VerifyButton.options,
            guildOnly: true,
            userPermissions: [PermissionsBitField.Flags.ManageGuild],
        });
    }

    async execute(
        interaction: Message | CommandInteraction,
        args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const components = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('requestVerificationLink').setLabel('Request Verification Link').setStyle(ButtonStyle.Primary)
        );

        if (args?.getBoolean('show_learn_more')) {
            components.addComponents(
                new ButtonBuilder().setCustomId('verificationLearnMore').setLabel('Learn More').setStyle(ButtonStyle.Secondary)
            );
        }

        const content = args?.getString('message') ?? 'Click the button below to request a verification link!';

        if (this.isMessage(interaction)) {
            await interaction.channel.send({ content: content, components: [components] });
        } else {
            const channel = interaction.channel ?? (await interaction.guild?.channels.fetch(interaction.channelId).catch(() => null));
            if (channel?.type !== ChannelType.GuildText) return;

            await channel.send({ content: content, components: [components] });
            await interaction.reply({ content: 'Verification button successfully created!', ephemeral: true });
        }
    }
}
