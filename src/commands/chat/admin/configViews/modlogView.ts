import {
    Guild,
    GuildChannel,
    Message,
    MessageActionRow,
    MessageButton,
    MessageComponentInteraction,
    MessageEmbed,
    Permissions,
    Snowflake,
} from 'discord.js';
import { GuildConfigCache } from '#util/guildConfigCache';
import { OverviewView } from './overviewView';
import { bold } from '@discordjs/builders';

export class ModlogView {
    static async render(interaction: MessageComponentInteraction, filter: (i: MessageComponentInteraction) => boolean): Promise<void> {
        const config = await GuildConfigCache.fetchOrCreate(interaction.guildId!);

        const embed = new MessageEmbed()
            .setTitle('Modlog Configuration')
            .setDescription(
                `Moderation logging is currently ${config.enableModlog ? bold('enabled') : bold('disabled')}.
                
                Logs will be sent to the channel: ${config.modlogChannelId ? `<#${config.modlogChannelId}>` : '<no channel set>'}`
            )
            .setColor('BLUE')
            .setTimestamp();

        const buttons = new MessageActionRow().addComponents(
            new MessageButton().setCustomId('configModlogEnable').setStyle('SUCCESS').setLabel('Enable').setDisabled(config.enableModlog),
            new MessageButton().setCustomId('configModlogDisable').setStyle('DANGER').setLabel('Disable').setDisabled(!config.enableModlog),
            new MessageButton().setCustomId('configModlogChangeChannel').setStyle('PRIMARY').setLabel('Set Modlog Channel'),
            new MessageButton().setCustomId('configModlogBack').setStyle('SECONDARY').setLabel('Back')
        );

        await interaction.reply({ embeds: [embed], components: [buttons] });

        const message = interaction.message as Message;
        await message
            .awaitMessageComponent({ filter, componentType: 'BUTTON', time: 1000 * 60 * 5 })
            .then(async (i) => {
                if (!i.isButton()) return;

                switch (i.customId) {
                    case 'configModlogEnable':
                        config.enableModlog = true;
                        await config.save();
                        await this.render(i, filter);
                        break;
                    case 'configModlogDisable':
                        config.enableModlog = false;
                        await config.save();
                        await this.render(i, filter);
                        break;
                    case 'configModlogChangeChannel':
                        await this.renderChannelChange(i, filter);
                        break;
                    case 'configModlogBack':
                        await OverviewView.render(i, filter);
                        break;
                }
            })
            .catch(async () => await message.edit({ components: [] }));
    }

    static async renderChannelChange(
        interaction: MessageComponentInteraction,
        filter: (i: MessageComponentInteraction) => boolean
    ): Promise<void> {
        const embed = new MessageEmbed().setDescription('What would you like the modlog channel to be?').setColor('ORANGE');

        const button = new MessageActionRow().addComponents(
            new MessageButton().setCustomId('configModlogChangeChannelCancel').setStyle('DANGER').setLabel('Cancel Modlog Channel Change')
        );

        await interaction.reply({ embeds: [embed], components: [button] });

        const message = interaction.message as Message;

        const buttonCollector = await message.createMessageComponentCollector({
            filter,
            componentType: 'BUTTON',
            time: 1000 * 60,
            max: 1,
        });
        const messageCollector = await message.channel.createMessageCollector({
            filter: (m) => m.author.id === interaction.user.id,
            time: 1000 * 60,
        });

        buttonCollector.on('collect', async (i) => {
            switch (i.customId) {
                case 'configModlogChangeChannelCancel':
                    buttonCollector.stop('cancelled');
                    messageCollector.stop('cancelled');
                    await this.render(i, filter);
                    break;
            }
        });

        messageCollector.on('collect', async (m) => {
            const channel = await this.parseChannel(m.guild!, m.content);

            if (!channel || !channel.viewable || !interaction.guild?.me) {
                const embed = new MessageEmbed()
                    .setDescription(
                        'The channel provided could not be found. Please make sure that the channel exists and that I have access to the channel.'
                    )
                    .setColor('RED');

                await m.reply({ embeds: [embed] });
            } else {
                if (channel.permissionsFor(interaction.guild.me).has([Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS])) {
                    const config = await GuildConfigCache.fetchOrCreate(m.guildId!);
                    config.modlogChannelId = channel.id;
                    await config.save();

                    const embed = new MessageEmbed()
                        .setDescription(`The modlog channel has been successfully updated to ${channel}.`)
                        .setColor('GREEN');

                    const button = new MessageActionRow().addComponents(
                        new MessageButton()
                            .setCustomId('configModlogChangeSuccessReturn')
                            .setStyle('SUCCESS')
                            .setLabel('View Modlog Config')
                    );

                    const successMessage = await m.reply({ embeds: [embed], components: [button] });
                    await message.edit({ components: [] });

                    buttonCollector.stop('completed');
                    messageCollector.stop('completed');

                    await successMessage
                        .awaitMessageComponent({ filter, componentType: 'BUTTON', time: 1000 * 60 * 1 })
                        .then(async (i) => {
                            if (!i.isButton()) return;

                            switch (i.customId) {
                                case 'configModlogChangeSuccessReturn':
                                    await this.render(i, filter);
                                    break;
                            }
                        })
                        .catch(async () => await successMessage.edit({ components: [] }));
                } else {
                    const embed = new MessageEmbed()
                        .setDescription(
                            'I do not have permission to send messages and embed links in the modlog channel you provided. Please update my permissions and try again.'
                        )
                        .setColor('RED');

                    await m.reply({ embeds: [embed] });
                }
            }
        });

        messageCollector.on('end', async (_, reason) => {
            switch (reason) {
                case 'completed':
                case 'cancelled':
                    break;
                default: {
                    const embed = new MessageEmbed()
                        .setTitle('Modlog Channel Change Cancelled')
                        .setDescription('No channel was provided within the time limit, so no changes were made.')
                        .setColor('RED')
                        .setTimestamp();
                    await message.edit({ embeds: [embed], components: [] });
                }
            }
        });
    }

    static async parseChannel(guild: Guild, message: string): Promise<GuildChannel | null> {
        const matches = message.match(/^<#(\d+)>$/);
        if (matches) {
            const id = matches[1] as Snowflake;
            const channel = await guild.channels.fetch(id);
            return channel;
        } else {
            await guild.channels.fetch();
            const channel = guild.channels.cache.find((c) => c.name === message && !c.isThread());
            if (channel) return channel as GuildChannel;
            else return null;
        }
    }
}
