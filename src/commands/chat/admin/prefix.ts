import {
    ApplicationCommandOption,
    CommandInteraction,
    CommandInteractionOptionResolver,
    Message,
    MessageEmbed,
    Permissions,
} from 'discord.js';
import Client from '../../../Client';
import { Command } from '../../Command';
import GuildConfigModel from '../../../models/guildConfig.model';
import { GuildConfigCache } from '../../../helpers/guildConfigCache';

export class Prefix extends Command {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'prefix',
            description: 'The new prefix that the bot will respond to',
            type: 'STRING',
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
            userPermissions: [Permissions.FLAGS.MANAGE_GUILD],
        });
    }

    async execute(interaction: Message | CommandInteraction, args?: CommandInteractionOptionResolver): Promise<void> {
        const newPrefix = args?.getString('prefix');

        if (newPrefix) {
            const guildConfig = await GuildConfigCache.fetchOrCreate(interaction.guild!.id);
            guildConfig.prefix = newPrefix;
            await guildConfig.save();

            this.sendSuccessEmbed(interaction, 'Prefix Updated', `The prefix has been set to \`${newPrefix}\``);
        } else {
            const guild = await GuildConfigModel.findOne({ guildId: interaction.guild!.id });
            const embed = new MessageEmbed()
                .setColor('BLUE')
                .setTitle('Bot Prefix')
                .setDescription(`The current prefix is \`${guild?.prefix || '$'}\`. You can also use Discord slash commands!`)
                .setTimestamp();

            interaction.reply({ embeds: [embed] });
        }
    }
}
