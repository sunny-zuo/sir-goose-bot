import {
    PermissionsBitField,
    ActionRowBuilder,
    ButtonBuilder,
    ApplicationCommandOption,
    CommandInteractionOptionResolver,
    ApplicationCommandOptionType,
    ButtonStyle,
    EmbedBuilder,
    Colors,
    ChatInputCommandInteraction,
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
            category: 'Admin',
            options: VerifyButton.options,
            guildOnly: true,
            userPermissions: [PermissionsBitField.Flags.ManageGuild],
        });
    }

    async execute(
        interaction: ChatInputCommandInteraction,
        args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        await interaction.deferReply({ ephemeral: true });

        const components = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('requestVerificationLink').setLabel('Request Verification Link').setStyle(ButtonStyle.Primary)
        );

        if (args?.getBoolean('show_learn_more')) {
            components.addComponents(
                new ButtonBuilder().setCustomId('verificationLearnMore').setLabel('Learn More').setStyle(ButtonStyle.Secondary)
            );
        }

        const content = args?.getString('message') ?? 'Click the button below to request a verification link!';
        const channel = interaction.channel ?? (await interaction.guild?.channels.fetch(interaction.channelId).catch(() => null));
        if (!channel || !channel.isSendable()) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder().setColor(Colors.Red).setDescription(
                        `Something went wrong trying to create the verification button. This might be because I do not have permissions to send messages in this channel.\n
                            If everything looks correct on your end, consider asking for help in [the support server](https://discord.gg/KHByMmrrw2).`
                    ),
                ],
            });
            return;
        }

        await channel.send({ content: content, components: [components] });
        await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription('Verification button successfully created!')],
        });
    }
}
