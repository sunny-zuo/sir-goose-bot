import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import { Message, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export class GuildList extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'guildlist',
            description: 'Lists all of the guilds the bot is in.',
            category: 'Owner',
            isSlashCommand: false,
            isTextCommand: true,
            ownerOnly: true,
            displayHelp: false,
        });
    }

    async execute(interaction: Message | ChatInputCommandInteraction): Promise<void> {
        const guilds = interaction.client.guilds.cache.map((guild) => `${guild.name} | ${guild.id} | ${guild.memberCount} members`);

        const embed = new EmbedBuilder()
            .setTitle('Guild List')
            .setTimestamp()
            .setColor('Blue')
            // TODO: paginate
            .setDescription(guilds.join('\n').substring(0, 2000));

        await interaction.reply({ embeds: [embed] });
    }
}
