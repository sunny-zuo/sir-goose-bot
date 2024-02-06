import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    Guild,
    GuildBasedChannel,
    MessageComponentInteraction,
    PermissionsBitField,
    Snowflake,
} from 'discord.js';
import { GuildConfigCache } from '#util/guildConfigCache';
import { OverviewView } from './overviewView';
import { bold } from 'discord.js';
import { Emojis } from '#util/constants';

export class ModlogView {
    static async render(interaction: MessageComponentInteraction, filter: (i: MessageComponentInteraction) => boolean): Promise<void> {
        const config = await GuildConfigCache.fetchOrCreate(interaction.guildId!);

        const embed = new EmbedBuilder()
            .setTitle('Modlog Configuration')
            .setDescription(
                `${config.enableModlog ? Emojis.GreenCheck : Emojis.RedCross} Moderation logging is currently ${
                    config.enableModlog ? bold('enabled') : bold('disabled')
                }.
                
                Logs will be sent to the channel: ${config.modlogChannelId ? `<#${config.modlogChannelId}>` : '<no channel set>'}`
            )
            .setColor('Blue')
            .setTimestamp();

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('configModlogEnable')
                .setStyle(ButtonStyle.Success)
                .setLabel('Enable')
                .setDisabled(config.enableModlog),
            new ButtonBuilder()
                .setCustomId('configModlogDisable')
                .setStyle(ButtonStyle.Danger)
                .setLabel('Disable')
                .setDisabled(!config.enableModlog),
            new ButtonBuilder().setCustomId('configModlogChangeChannel').setStyle(ButtonStyle.Primary).setLabel('Set Modlog Channel'),
            new ButtonBuilder().setCustomId('configModlogBack').setStyle(ButtonStyle.Secondary).setLabel('Back')
        );

        await interaction.update({ embeds: [embed], components: [buttons] });

        const message = interaction.message;
        await message
            .awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 1000 * 60 * 5 })
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
            .catch(async (e) => {
                if (e.name === 'Error [InteractionCollectorError]') {
                    await message.edit({ components: [] });
                } else {
                    throw e;
                }
            });
    }

    static async renderChannelChange(
        interaction: MessageComponentInteraction,
        filter: (i: MessageComponentInteraction) => boolean
    ): Promise<void> {
        const embed = new EmbedBuilder().setDescription('What would you like the modlog channel to be?').setColor('Orange');

        const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('configModlogChangeChannelCancel')
                .setStyle(ButtonStyle.Danger)
                .setLabel('Cancel Modlog Channel Change')
        );

        await interaction.update({ embeds: [embed], components: [button] });

        const message = interaction.message;

        const buttonCollector = message.createMessageComponentCollector({
            filter,
            componentType: ComponentType.Button,
            time: 1000 * 60,
            max: 1,
        });
        const messageCollector = message.channel.createMessageCollector({
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

            if (!channel || !channel.viewable || !interaction.guild?.members.me) {
                const embed = new EmbedBuilder()
                    .setDescription(
                        'The channel provided could not be found. Please make sure that the channel exists and that I have access to the channel.'
                    )
                    .setColor('Red');

                await m.reply({ embeds: [embed] });
            } else {
                if (
                    channel
                        .permissionsFor(interaction.guild.members.me!)
                        .has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks])
                ) {
                    const config = await GuildConfigCache.fetchOrCreate(m.guildId!);
                    config.modlogChannelId = channel.id;
                    await config.save();

                    const embed = new EmbedBuilder()
                        .setDescription(`The modlog channel has been successfully updated to ${channel}.`)
                        .setColor('Green');

                    const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder()
                            .setCustomId('configModlogChangeSuccessReturn')
                            .setStyle(ButtonStyle.Success)
                            .setLabel('View Modlog Config')
                    );

                    const successMessage = await m.reply({ embeds: [embed], components: [button] });
                    await message.edit({ components: [] });

                    buttonCollector.stop('completed');
                    messageCollector.stop('completed');

                    await successMessage
                        .awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 1000 * 60 * 1 })
                        .then(async (i) => {
                            if (!i.isButton()) return;

                            switch (i.customId) {
                                case 'configModlogChangeSuccessReturn':
                                    await this.render(i, filter);
                                    break;
                            }
                        })
                        .catch(async (e) => {
                            if (e.name === 'Error [InteractionCollectorError]') {
                                await successMessage.edit({ components: [] });
                            } else {
                                throw e;
                            }
                        });
                } else {
                    const embed = new EmbedBuilder()
                        .setDescription(
                            'I do not have permission to send messages and embed links in the modlog channel you provided. Please update my permissions and try again.'
                        )
                        .setColor('Red');

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
                    const embed = new EmbedBuilder()
                        .setTitle('Modlog Channel Change Cancelled')
                        .setDescription('No channel was provided within the time limit, so no changes were made.')
                        .setColor('Red')
                        .setTimestamp();
                    await message.edit({ embeds: [embed], components: [] });
                }
            }
        });
    }

    static async parseChannel(guild: Guild, message: string): Promise<GuildBasedChannel | null> {
        const matches = message.match(/^<#(\d+)>$/);
        if (matches) {
            const id = matches[1] as Snowflake;
            const channel = await guild.channels.fetch(id).catch(() => null);
            return channel;
        } else {
            await guild.channels.fetch();
            const channel = guild.channels.cache.find((c) => c.name === message && !c.isThread());
            if (channel) return channel;
            else return null;
        }
    }
}
