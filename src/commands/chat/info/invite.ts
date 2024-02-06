import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import { Message, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export class Invite extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'invite',
            description: 'Get an invite link to add Sir Goose to your server!',
            category: 'Info',
            cooldownSeconds: 5,
        });
    }

    async execute(interaction: Message | ChatInputCommandInteraction): Promise<void> {
        const embed = new EmbedBuilder().setDescription('Press the button below to add Sir Goose to your server:').setColor('Green');
        const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel('Invite!')
                .setStyle(ButtonStyle.Link)
                .setURL(
                    'https://discord.com/api/oauth2/authorize?client_id=740653704683716699&permissions=8&scope=bot%20applications.commands'
                )
        );

        await interaction.reply({ embeds: [embed], components: [button] });
    }
}
