import { ActionRowBuilder, ButtonBuilder, MessageComponentInteraction, EmbedBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { OverviewView } from './overviewView';
import { GuildConfigCache } from '#util/guildConfigCache';

export class PrefixView {
    static async render(interaction: MessageComponentInteraction, filter: (i: MessageComponentInteraction) => boolean): Promise<void> {
        const { prefix } = await GuildConfigCache.fetchOrCreate(interaction.guildId!);
        const embed = new EmbedBuilder()
            .setTitle('Prefix Configuration')
            .setDescription(
                `The prefix that the bot will respond to is currently set to \`${prefix}\`.

                You can also use slash commands! (highly recommended)`
            )
            .setColor('Blue')
            .setTimestamp();

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('configPrefixChange').setStyle(ButtonStyle.Primary).setLabel('Change Prefix'),
            new ButtonBuilder().setCustomId('configPrefixBack').setStyle(ButtonStyle.Secondary).setLabel('Back')
        );

        await interaction.update({ embeds: [embed], components: [buttons] });

        const message = interaction.message;
        await message
            .awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 1000 * 60 * 5 })
            .then(async (i) => {
                if (!i.isButton()) return;

                switch (i.customId) {
                    case 'configPrefixChange':
                        await PrefixView.renderPrefixChange(i, filter);
                        break;
                    case 'configPrefixBack':
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

    static async renderPrefixChange(
        interaction: MessageComponentInteraction,
        filter: (i: MessageComponentInteraction) => boolean
    ): Promise<void> {
        const embed = new EmbedBuilder().setDescription('What would you like the new prefix to be?').setColor('Orange');

        const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('configPrefixChangeCancel').setStyle(ButtonStyle.Danger).setLabel('Cancel Prefix Change')
        );

        await interaction.update({ embeds: [embed], components: [button] });

        const message = interaction.message;

        const buttonCollector = await message.createMessageComponentCollector({
            filter,
            componentType: ComponentType.Button,
            time: 1000 * 60,
            max: 1,
        });
        const messageCollector = await message.channel.createMessageCollector({
            filter: (m) => m.author.id === interaction.user.id,
            time: 1000 * 60,
        });

        buttonCollector.on('collect', async (i) => {
            switch (i.customId) {
                case 'configPrefixChangeCancel':
                    buttonCollector.stop('cancelled');
                    messageCollector.stop('cancelled');
                    await PrefixView.render(i, filter);
                    break;
            }
        });

        messageCollector.on('collect', async (m) => {
            const newPrefix = m.content.trim();
            if (newPrefix.length > 5 || newPrefix.length === 0) {
                const embed = new EmbedBuilder()
                    .setDescription('The prefix must be 1 to 5 characters in length. Please provide a new prefix.')
                    .setColor('Red');

                await m.channel.send({ embeds: [embed] });
            } else {
                const config = await GuildConfigCache.fetchOrCreate(interaction.guildId!);
                config.prefix = newPrefix;
                await config.save();

                const embed = new EmbedBuilder()
                    .setDescription(`The prefix has been successfully updated to \`${newPrefix}\`.`)
                    .setColor('Green');

                const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId('configPrefixChangeSuccessReturn')
                        .setStyle(ButtonStyle.Success)
                        .setLabel('View Prefix Config')
                );

                const successMessage = await m.channel.send({ embeds: [embed], components: [button] });
                await message.edit({ components: [] });

                buttonCollector.stop('completed');
                messageCollector.stop('completed');

                await successMessage
                    .awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 1000 * 60 * 1 })
                    .then(async (i) => {
                        if (!i.isButton()) return;

                        switch (i.customId) {
                            case 'configPrefixChangeSuccessReturn':
                                await PrefixView.render(i, filter);
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
            }
        });

        messageCollector.on('end', async (_, reason) => {
            switch (reason) {
                case 'completed':
                case 'cancelled':
                    break;
                default: {
                    const embed = new EmbedBuilder()
                        .setTitle('Prefix Change Cancelled')
                        .setDescription('No prefix was provided within the time limit, so no changes were made.')
                        .setColor('Red')
                        .setTimestamp();
                    await message.edit({ embeds: [embed], components: [] });
                }
            }
        });
    }
}
