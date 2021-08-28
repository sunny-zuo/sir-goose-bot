import { ChatCommand } from '../ChatCommand';
import Client from '../../../Client';
import { CommandInteraction, Message, MessageEmbed } from 'discord.js';

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

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        if (Math.random() < 0.5) {
            const embed = new MessageEmbed()
                .setColor('BLUE')
                .setImage('https://i.imgur.com/3YvGn4c.png')
                .setFooter(`Requested by ${this.getUser(interaction).tag}`, this.getUser(interaction).displayAvatarURL());

            interaction.reply({ content: `Coin flipped: It's heads!`, embeds: [embed] });
            return;
        } else {
            const embed = new MessageEmbed()
                .setColor('BLUE')
                .setImage('https://i.imgur.com/pzSSgHA.png')
                .setFooter(`Requested by ${this.getUser(interaction).tag}`, this.getUser(interaction).displayAvatarURL());

            interaction.reply({ content: `Coin flipped: It's tails!`, embeds: [embed] });
            return;
        }
    }
}
