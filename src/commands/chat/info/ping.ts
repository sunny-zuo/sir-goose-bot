import { Command } from '../../Command';
import Client from '../../../Client';
import { Message, CommandInteraction, MessageEmbed } from 'discord.js';
import { inlineCode } from '@discordjs/builders';

export class Ping extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'ping',
            description: "Get Sir Goose's heartbeat and round trip API latency.",
            category: 'Info',
            cooldownSeconds: 5,
        });
    }

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        const message = (await interaction.reply({
            embeds: [new MessageEmbed().setDescription('Pinging...').setColor('BLUE')],
            fetchReply: true,
        })) as Message;
        const ping = message.createdTimestamp - interaction.createdTimestamp;
        const heartbeat = this.client.ws.ping;

        const embed = new MessageEmbed()
            .setDescription(
                `Pong! Sir Goose's roundtrip latency is ${`${inlineCode(`${ping.toString()}ms`)}`}. The websocket heartbeat is ${inlineCode(
                    `${heartbeat.toString()}ms`
                )}.`
            )
            .setColor('BLUE');

        message.edit({ embeds: [embed] });
    }
}
