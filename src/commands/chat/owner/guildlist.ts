import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageComponentInteraction,
} from 'discord.js';

export class GuildList extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'guildlist',
            description: 'Lists all of the guilds the bot is in.',
            category: 'Owner',
            isSlashCommand: true,
            isTextCommand: false,
            ownerOnly: true,
            displayHelp: false,
        });
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();

        const guildData = interaction.client.guilds.cache.map((guild) => {
            return { name: guild.name, id: guild.id, memberCount: guild.memberCount };
        });

        guildData.sort((a, b) => b.memberCount - a.memberCount);
        const maxPage = Math.ceil(guildData.length / 15) - 1;
        let currPage = 0;

        const pageButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('guildListPrev').setLabel('Previous').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('guildListNext').setLabel('Next').setStyle(ButtonStyle.Primary)
        );

        const message = await interaction.editReply({
            embeds: [this.createPageEmbed(guildData, currPage)],
            components: [pageButtons],
        });
        const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;

        const buttonCollector = message.createMessageComponentCollector({
            filter,
            time: 1000 * 60 * 5,
        });

        buttonCollector.on('collect', async (i) => {
            switch (i.customId) {
                case 'guildListPrev':
                    currPage = currPage === 0 ? maxPage : currPage - 1;
                    break;
                case 'guildListNext':
                    currPage = currPage === maxPage ? 0 : currPage + 1;
                    break;
            }

            await i.update({ embeds: [this.createPageEmbed(guildData, currPage)], components: [pageButtons] });
        });

        buttonCollector.on('end', async () => {
            await message.edit({ components: [] });
        });
    }

    createPageEmbed(guildData: { name: string; id: string; memberCount: number }[], page: number): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle(`Guild List`)
            .setColor('Blue')
            .setDescription(
                guildData
                    .slice(page * 15, page * 15 + 15)
                    .map((guild) => `${guild.name} | ${guild.id} | ${guild.memberCount} members`)
                    .join('\n')
            )
            .setTimestamp()
            .setFooter({ text: `Page ${page + 1}/${Math.ceil(guildData.length / 15)}` });
    }
}
