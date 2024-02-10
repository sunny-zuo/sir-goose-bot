import { ActionRowBuilder, ButtonBuilder, MessageComponentInteraction, EmbedBuilder, ButtonStyle, ComponentType, bold } from 'discord.js';
import { GuildConfigCache } from '#util/guildConfigCache';
import { OverviewView } from './overviewView';
import { Emojis } from '#util/constants';

export class PinsView {
    static async render(interaction: MessageComponentInteraction, filter: (i: MessageComponentInteraction) => boolean): Promise<void> {
        const config = await GuildConfigCache.fetchOrCreate(interaction.guildId!);

        const embed = new EmbedBuilder()
            .setTitle('Pins Configuration')
            .setDescription(
                `${config.enablePins ? Emojis.GreenCheck : Emojis.RedCross} Pinning is currently ${
                    config.enablePins ? bold(`enabled`) : bold(`disabled`)
                }.
            
                Pinning gives all users the ability to pin messages, using the ${
                    config.prefix
                }pin command or via the right click menu under "Apps".`
            )
            .setColor('Blue')
            .setTimestamp();

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('configPinsEnable')
                .setStyle(ButtonStyle.Success)
                .setLabel('Enable')
                .setDisabled(config.enablePins),
            new ButtonBuilder()
                .setCustomId('configPinsDisable')
                .setStyle(ButtonStyle.Danger)
                .setLabel('Disable')
                .setDisabled(!config.enablePins),
            new ButtonBuilder().setCustomId('configPinsBack').setStyle(ButtonStyle.Secondary).setLabel('Back')
        );

        await interaction.update({ embeds: [embed], components: [buttons] });

        const message = interaction.message;
        await message
            .awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 1000 * 60 * 5 })
            .then(async (i) => {
                if (!i.isButton()) return;

                switch (i.customId) {
                    case 'configPinsEnable':
                        config.enablePins = true;
                        await config.save();
                        await PinsView.render(i, filter);
                        break;
                    case 'configPinsDisable':
                        config.enablePins = false;
                        await config.save();
                        await PinsView.render(i, filter);
                        break;
                    case 'configPinsBack':
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
}
