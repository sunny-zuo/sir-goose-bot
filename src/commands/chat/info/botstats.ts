import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { hyperlink, codeBlock } from '@discordjs/builders';
import { Duration } from 'luxon';
import { execSync } from 'child_process';
import { cpus } from 'os';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../../../../package.json');

export class BotStats extends ChatCommand {
    latestCommit: string;

    constructor(client: Client) {
        super(client, {
            name: 'botstats',
            description: 'View statistics related to Sir Goose.',
            category: 'Info',
            aliases: ['botinfo', 'bs'],
            cooldownSeconds: 5,
        });

        this.latestCommit = execSync('git rev-parse HEAD').toString().trim().substring(0, 7);
    }

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        const fieldMaxLength = 10;

        const uptimeDuration = Duration.fromMillis(this.client.uptime ?? 0).shiftTo('days', 'hours');
        const uptimeDays = Math.floor(uptimeDuration.days);
        const uptimeHours = Math.floor(uptimeDuration.hours);

        const embed = new MessageEmbed()
            .setTitle('Sir Goose Stats')
            .setDescription(
                `${hyperlink(
                    'Add Sir Goose to your server!',
                    'https://discord.com/api/oauth2/authorize?client_id=740653704683716699&permissions=8&scope=bot%20applications.commands'
                )} ~ ${hyperlink('View on GitHub', 'https://github.com/sunny-zuo/sir-goose-bot')}`
            )
            .setColor('BLUE')
            .setTimestamp();

        embed.addFields([
            {
                name: 'Servers',
                value: this.formatValue(this.client.guilds.cache.size.toString(), fieldMaxLength),
                inline: true,
            },
            {
                name: 'Channels',
                value: this.formatValue(this.client.channels.cache.size.toString(), fieldMaxLength),
                inline: true,
            },
            {
                name: 'Users',
                value: this.formatValue(
                    this.client.guilds.cache.reduce((total, guild) => (total += guild.memberCount), 0).toString(),
                    fieldMaxLength
                ),
                inline: true,
            },
            {
                name: 'CPU Usage',
                value: this.formatValue(`${this.calculateCPUUsage().toFixed(2)}%`, fieldMaxLength),
                inline: true,
            },
            {
                name: 'RAM Usage',
                value: this.formatValue(`${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`, fieldMaxLength),
                inline: true,
            },
            {
                name: 'Ping',
                value: this.formatValue(`${this.client.ws.ping}ms`, fieldMaxLength),
                inline: true,
            },
            {
                name: 'Bot Version',
                value: this.formatValue(version ?? 'Unknown', fieldMaxLength),
                inline: true,
            },
            {
                name: 'Commit',
                value: this.formatValue(this.latestCommit, fieldMaxLength),
                inline: true,
            },
            {
                name: 'Uptime',
                value: this.formatValue(`${uptimeDays}d ${uptimeHours}h`, fieldMaxLength),
                inline: true,
            },
        ]);

        await interaction.reply({ embeds: [embed] });
    }

    formatValue(value: string, length: number): string {
        return codeBlock('yaml', `${value.padEnd(length)}`);
    }

    calculateCPUUsage(): number {
        const cores = cpus().map((c) => (c.times.user + c.times.nice + c.times.sys + c.times.irq) / c.times.idle);
        return cores.reduce((a, b) => a + b) / cores.length;
    }
}
