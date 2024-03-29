import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import { ChatInputCommandInteraction, Message, EmbedBuilder } from 'discord.js';

export class Coinflip extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'coinflip',
            description: 'Flip a coin.',
            category: 'Fun',
            aliases: ['flipcoin', 'flip', 'coin'],
            cooldownSeconds: 2,
        });
    }

    async execute(interaction: Message | ChatInputCommandInteraction): Promise<void> {
        if (Math.random() < 0.5) {
            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setImage('https://i.imgur.com/3YvGn4c.png')
                .setFooter({
                    text: `Requested by ${this.getUser(interaction).tag}`,
                    iconURL: this.getUser(interaction).displayAvatarURL(),
                });

            await interaction.reply({ content: `Coin flipped: It's heads!`, embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setImage('https://i.imgur.com/pzSSgHA.png')
                .setFooter({
                    text: `Requested by ${this.getUser(interaction).tag}`,
                    iconURL: this.getUser(interaction).displayAvatarURL(),
                });

            await interaction.reply({ content: `Coin flipped: It's tails!`, embeds: [embed] });
        }
    }
}
