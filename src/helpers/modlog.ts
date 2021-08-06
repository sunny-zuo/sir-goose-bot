import { ColorResolvable, Guild, MessageEmbed, Permissions, TextChannel, User } from 'discord.js';
import Client from '../Client';
import { GuildConfigCache } from './guildConfigCache';

export class Modlog {
    static async logUserAction(
        client: Client,
        guild: Guild | null,
        user: User,
        message: string,
        color: ColorResolvable = 'BLUE'
    ): Promise<void> {
        if (!guild || !guild.me) return;

        const channel = await this.fetchModlogChannel(guild);

        if (channel && channel.permissionsFor(guild.me).has([Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS])) {
            const embed = new MessageEmbed()
                .setAuthor(`${user.tag}`, user.displayAvatarURL())
                .setColor(color)
                .setDescription(message)
                .setFooter(`ID: ${user.id}`)
                .setTimestamp();

            await channel.send({ embeds: [embed] }).catch((e) => client.log.error(e, e.stack));
        }
    }

    static async logInfoMessage(
        client: Client,
        guild: Guild | null,
        title: string,
        message: string,
        color: ColorResolvable = 'BLUE'
    ): Promise<void> {
        if (!guild || !guild.me) return;

        const channel = await this.fetchModlogChannel(guild);

        if (channel && channel.permissionsFor(guild.me).has([Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS])) {
            const embed = new MessageEmbed().setTitle(title).setColor(color).setDescription(message).setTimestamp();
            await channel.send({ embeds: [embed] }).catch((e) => client.log.error(e, e.stack));
        }
    }

    static async fetchModlogChannel(guild: Guild): Promise<TextChannel | null> {
        const config = await GuildConfigCache.fetchConfig(guild.id);
        if (config.enableModlog && config.modlogChannelId) {
            const channel = await guild.channels.fetch(config.modlogChannelId);

            if (channel && channel.type === 'GUILD_TEXT') {
                return channel;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }
}
