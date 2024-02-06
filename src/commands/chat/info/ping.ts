import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import { Message, ChatInputCommandInteraction, EmbedBuilder, inlineCode } from 'discord.js';

export class Ping extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'ping',
            description: "Get Sir Goose's heartbeat and round trip API latency.",
            category: 'Info',
            cooldownSeconds: 5,
        });
    }

    async execute(interaction: Message | ChatInputCommandInteraction): Promise<void> {
        const message = await interaction.reply({
            embeds: [new EmbedBuilder().setDescription('Pinging...').setColor('Blue')],
            fetchReply: true,
        });
        const ping = message.createdTimestamp - interaction.createdTimestamp;
        const heartbeat = this.client.ws.ping;

        const embed = new EmbedBuilder()
            .setDescription(
                `Pong! Sir Goose's roundtrip latency is ${`${inlineCode(`${ping.toString()}ms`)}`}. The websocket heartbeat is ${inlineCode(
                    `${heartbeat.toString()}ms`
                )}.`
            )
            .setColor('Blue');

        await message.edit({ embeds: [embed] });
    }
}
