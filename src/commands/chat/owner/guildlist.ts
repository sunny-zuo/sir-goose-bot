import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import { Message, CommandInteraction, MessageEmbed } from 'discord.js';

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

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        const guilds = interaction.client.guilds.cache.map((guild) => `${guild.name} | ${guild.id} | ${guild.memberCount} members`);

        const embed = new MessageEmbed()
            .setTitle('Guild List')
            .setTimestamp()
            .setColor('BLUE')
            // TODO: paginate
            .setDescription(guilds.join('\n').substring(0, 2000));

        await interaction.reply({ embeds: [embed] });
    }
}
