import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelSelectMenuBuilder,
    ChannelType,
    ComponentType,
    EmbedBuilder,
    MessageComponentInteraction,
    PermissionsBitField,
} from 'discord.js';
import { GuildConfigCache } from '#util/guildConfigCache';
import { OverviewView } from './overviewView';
import { bold } from 'discord.js';
import { Emojis } from '#util/constants';
import { logger } from '#util/logger';

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
                        await ModlogView.render(i, filter);
                        break;
                    case 'configModlogDisable':
                        config.enableModlog = false;
                        await config.save();
                        await ModlogView.render(i, filter);
                        break;
                    case 'configModlogChangeChannel':
                        await ModlogView.renderChannelChange(i, filter);
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
        const config = await GuildConfigCache.fetchOrCreate(interaction.guildId!);

        const embed = new EmbedBuilder()
            .setDescription(
                `What channel do you want Sir Goose moderation logs to be sent to?\n
                The current log channel is ${
                    config.modlogChannelId ? `<#${config.modlogChannelId}>.` : 'not set, so no logs will be sent.'
                }`
            )
            .setColor('Aqua');

        const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('configModlogChangeChannelCancel').setStyle(ButtonStyle.Danger).setLabel('Cancel Change')
        );

        const channelSelectRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('configModlogChannelChangeChannelSelect')
                .setPlaceholder('Select the new modlog channel')
                .setChannelTypes(ChannelType.GuildText)
                .setMaxValues(1)
        );

        await interaction.update({ embeds: [embed], components: [channelSelectRow, buttonRow] });

        const message = interaction.message;
        await message
            .awaitMessageComponent({ filter, time: 1000 * 60 * 5 })
            .then(async (i) => {
                if (!i.inCachedGuild()) {
                    return logger.error('modlogView.renderChannelChange interaction was not in a cached guild.');
                }

                switch (i.customId) {
                    case 'configModlogChangeChannelCancel':
                        await ModlogView.render(i, filter);
                        break;
                    case 'configModlogChannelChangeChannelSelect': {
                        if (!i.isChannelSelectMenu()) {
                            return logger.error(
                                `Expected channel select menu in modlogView.renderChannelChange, but got ${i.componentType}`
                            );
                        }

                        const channel = i.channels.first();
                        if (!channel || !channel.isTextBased() || channel.isDMBased()) {
                            return logger.error(`Expected guild text channel in modlogView.renderChannelChange, but got ${channel?.type}`);
                        }

                        if (
                            channel
                                .permissionsFor(interaction.guild!.members.me!)
                                .has([
                                    PermissionsBitField.Flags.ViewChannel,
                                    PermissionsBitField.Flags.SendMessages,
                                    PermissionsBitField.Flags.EmbedLinks,
                                ])
                        ) {
                            const config = await GuildConfigCache.fetchOrCreate(i.guildId!);
                            config.modlogChannelId = channel.id;
                            await config.save();

                            const embed = new EmbedBuilder()
                                .setDescription(`The modlog channel has been successfully updated to ${channel}.`)
                                .setColor('Green');

                            await ModlogView.renderChannelChangeResult(i, filter, embed, ModlogView.render);
                        } else {
                            const embed = new EmbedBuilder()
                                .setDescription(
                                    'I do not have permission to view, send messages and/or embed links in the modlog channel you provided. Please update my permissions and try again.'
                                )
                                .setColor('Red');

                            await ModlogView.renderChannelChangeResult(i, filter, embed, ModlogView.renderChannelChange);
                        }
                    }
                }
            })
            .catch(async (e) => {
                if (e.name === 'Error [InteractionCollectorError]') {
                    const embed = new EmbedBuilder()
                        .setTitle('Modlog Channel Change Cancelled')
                        .setDescription('No channel was provided within the time limit, so no changes were made.')
                        .setColor('Red')
                        .setTimestamp();
                    await message.edit({ embeds: [embed], components: [] });
                } else {
                    throw e;
                }
            });
    }

    static async renderChannelChangeResult(
        interaction: MessageComponentInteraction,
        filter: (i: MessageComponentInteraction) => boolean,
        embed: EmbedBuilder,
        backFunction: (i: MessageComponentInteraction, filter: (i: MessageComponentInteraction) => boolean) => Promise<void>
    ): Promise<void> {
        const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('configModlogChangeBack').setStyle(ButtonStyle.Secondary).setLabel('Back')
        );

        await interaction.update({ embeds: [embed], components: [button] });

        const message = interaction.message;
        await message
            .awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 1000 * 60 * 5 })
            .then(async (i) => {
                switch (i.customId) {
                    case 'configModlogChangeBack':
                        await backFunction(i, filter);
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
}
