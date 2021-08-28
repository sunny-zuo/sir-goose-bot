import { ChatCommand } from '../ChatCommand';
import Client from '../../../Client';
import { Message, CommandInteraction, MessageEmbed, MessageActionRow, MessageButton } from 'discord.js';

export class Invite extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'invite',
            description: 'Get an invite link to add Sir Goose to your server!',
            category: 'Info',
            cooldownSeconds: 5,
        });
    }

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        const embed = new MessageEmbed().setDescription('Press the button below to add Sir Goose to your server:').setColor('GREEN');
        const button = new MessageActionRow().addComponents(
            new MessageButton()
                .setLabel('Invite!')
                .setStyle('LINK')
                .setURL(
                    'https://discord.com/api/oauth2/authorize?client_id=740653704683716699&permissions=8&scope=bot%20applications.commands'
                )
        );

        await interaction.reply({ embeds: [embed], components: [button] });
    }
}
