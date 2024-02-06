import {
    ApplicationCommandOption,
    ApplicationCommandOptionType,
    CommandInteractionOptionResolver,
    Message,
    EmbedBuilder,
    PermissionsBitField,
    ChatInputCommandInteraction,
} from 'discord.js';
import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import GuildConfigModel from '#models/guildConfig.model';
import { GuildConfigCache } from '#util/guildConfigCache';

export class Prefix extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'prefix',
            description: 'The new prefix that the bot will respond to',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ];

    constructor(client: Client) {
        super(client, {
            name: 'prefix',
            description: 'View or set the prefix the bot will respond to for message commands',
            category: 'Admin',
            options: Prefix.options,
            guildOnly: true,
            examples: ['!'],
            userPermissions: [PermissionsBitField.Flags.ManageGuild],
        });
    }

    async execute(
        interaction: Message | ChatInputCommandInteraction,
        args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const newPrefix = args?.getString('prefix');

        if (newPrefix) {
            const guildConfig = await GuildConfigCache.fetchOrCreate(interaction.guild!.id);
            guildConfig.prefix = newPrefix;
            await guildConfig.save();

            await this.sendSuccessEmbed(interaction, 'Prefix Updated', `The prefix has been set to \`${newPrefix}\``);
        } else {
            const guild = await GuildConfigModel.findOne({ guildId: interaction.guild!.id });
            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('Bot Prefix')
                .setDescription(`The current prefix is \`${guild?.prefix || '$'}\`. You can also use Discord slash commands!`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    }
}
