import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import {
    Message,
    EmbedBuilder,
    ApplicationCommandOption,
    CommandInteractionOptionResolver,
    GuildMember,
    ChatInputCommandInteraction,
    ApplicationCommandOptionType,
} from 'discord.js';

export class Avatar extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'user',
            description: "The user who's avatar you want to fetch. Defaults to yourself.",
            type: ApplicationCommandOptionType.User,
            required: false,
        },
    ];

    constructor(client: Client) {
        super(client, {
            name: 'avatar',
            description: "Get a user's avatar.",
            category: 'Info',
            options: Avatar.options,
            cooldownSeconds: 2,
        });
    }

    async execute(
        interaction: Message | ChatInputCommandInteraction,
        args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const member: GuildMember = (args?.getMember('user') as GuildMember) ?? null;
        const user = args?.getUser('user') ?? this.getUser(interaction);
        const avatarURL =
            member?.displayAvatarURL({ extension: 'png', size: 512 }) ?? user.displayAvatarURL({ extension: 'png', size: 512 });

        const embed = new EmbedBuilder()
            .setTitle('Avatar')
            .setAuthor({ name: user.tag, iconURL: avatarURL })
            .setImage(avatarURL)
            .setColor('Blue');

        await interaction.reply({ embeds: [embed] });
    }
}
