import {
    ColorResolvable,
    Guild,
    EmbedBuilder,
    PermissionsBitField,
    User,
    MessageCreateOptions,
    Message,
    GuildTextBasedChannel,
} from 'discord.js';
import { GuildConfigCache } from './guildConfigCache';
import { logger } from '#util/logger';

export class Modlog {
    static async logUserAction(guild: Guild | null, user: User, message: string, color: ColorResolvable = 'Blue'): Promise<Message | void> {
        if (!guild || !guild.members.me) return;

        const channel = await this.fetchModlogChannel(guild);

        if (
            channel &&
            channel.permissionsFor(guild.members.me).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks])
        ) {
            const embed = this.getUserEmbed(user, message, color);
            const sentMessage = await channel.send({ embeds: [embed] }).catch((e) => logger.error(e, e.message));
            return sentMessage;
        }
    }

    static async logInfoMessage(
        guild: Guild | null,
        title: string,
        message: string,
        color: ColorResolvable = 'Blue'
    ): Promise<Message | void> {
        if (!guild || !guild.members.me) return;

        const channel = await this.fetchModlogChannel(guild);

        if (
            channel &&
            channel.permissionsFor(guild.members.me).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks])
        ) {
            const embed = new EmbedBuilder().setTitle(title).setColor(color).setDescription(message).setTimestamp();
            const sentMessage = await channel.send({ embeds: [embed] }).catch((e) => logger.error(e, e.message));
            return sentMessage;
        }
    }

    static async logMessage(guild: Guild | null, message: MessageCreateOptions): Promise<Message | void> {
        if (!guild || !guild.members.me) return;

        const channel = await this.fetchModlogChannel(guild);

        if (channel) {
            const sentMessage = await channel.send(message).catch((e) => logger.error(e, e.message));
            return sentMessage;
        }
    }

    static getUserEmbed(user: User, message: string, color: ColorResolvable = 'Blue'): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
            .setColor(color)
            .setDescription(message)
            .setFooter({ text: `ID: ${user.id}` })
            .setTimestamp();

        return embed;
    }

    static async fetchModlogChannel(guild: Guild): Promise<GuildTextBasedChannel | null> {
        const config = await GuildConfigCache.fetchConfig(guild.id);
        if (config.enableModlog && config.modlogChannelId) {
            try {
                const channel = await guild.channels.fetch(config.modlogChannelId).catch(() => null);
                if (channel && channel.isTextBased() && !channel.isDMBased()) {
                    return channel;
                } else {
                    return null;
                }
            } catch (e) {
                logger.warn({ modlog: 'channelFetch' }, e);
                return null;
            }
        } else {
            return null;
        }
    }
}
