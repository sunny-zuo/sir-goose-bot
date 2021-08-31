import { ChatCommand } from '../ChatCommand';
import Client from '../../../Client';
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

        this.latestCommit = execSync('git rev-parse HEAD').toString().trim().substr(0, 7);
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

        embed.addField('Servers', this.formatValue(this.client.guilds.cache.size.toString(), fieldMaxLength), true);
        embed.addField('Channels', this.formatValue(this.client.channels.cache.size.toString(), fieldMaxLength), true);
        embed.addField(
            'Users',
            this.formatValue(this.client.guilds.cache.reduce((total, guild) => (total += guild.memberCount), 0).toString(), fieldMaxLength),
            true
        );

        embed.addField('CPU Usage', this.formatValue(`${this.calculateCPUUsage().toFixed(2)}%`, fieldMaxLength), true);
        embed.addField(
            'RAM Usage',
            this.formatValue(`${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`, fieldMaxLength),
            true
        );
        embed.addField('Ping', this.formatValue(`${this.client.ws.ping}ms`, fieldMaxLength), true);

        embed.addField('Bot Version', this.formatValue(version ?? 'Unknown', fieldMaxLength), true);
        embed.addField('Commit', this.formatValue(this.latestCommit, fieldMaxLength), true);
        embed.addField('Uptime', this.formatValue(`${uptimeDays}d ${uptimeHours}h`, fieldMaxLength), true);

        interaction.reply({ embeds: [embed] });
    }

    formatValue(value: string, length: number): string {
        return codeBlock('yaml', `${value.padEnd(length)}`);
    }

    calculateCPUUsage(): number {
        const cores = cpus().map((c) => (c.times.user + c.times.nice + c.times.sys + c.times.irq) / c.times.idle);
        return cores.reduce((a, b) => a + b) / cores.length;
    }
}
