import { Message, MessageActionRow, MessageButton, MessageComponentInteraction, MessageEmbed } from 'discord.js';
import { GuildConfigCache } from '#util/guildConfigCache';
import { OverviewView } from './overviewView';
import { bold } from '@discordjs/builders';

export class PinsView {
    static async render(interaction: MessageComponentInteraction, filter: (i: MessageComponentInteraction) => boolean): Promise<void> {
        const config = await GuildConfigCache.fetchOrCreate(interaction.guildId!);

        const embed = new MessageEmbed()
            .setTitle('Pins Configuration')
            .setDescription(
                `Pinning is currently ${config.enablePins ? bold('enabled') : bold('disabled')}.
            
                Pinning gives all users the ability to pin messages, using the ${
                    config.prefix
                }pin command or via the right click menu under "Apps".`
            )
            .setColor('BLUE')
            .setTimestamp();

        const buttons = new MessageActionRow().addComponents(
            new MessageButton().setCustomId('configPinsEnable').setStyle('SUCCESS').setLabel('Enable').setDisabled(config.enablePins),
            new MessageButton().setCustomId('configPinsDisable').setStyle('DANGER').setLabel('Disable').setDisabled(!config.enablePins),
            new MessageButton().setCustomId('configPinsBack').setStyle('SECONDARY').setLabel('Back')
        );

        await interaction.reply({ embeds: [embed], components: [buttons] });

        const message = interaction.message as Message;
        await message
            .awaitMessageComponent({ filter, componentType: 'BUTTON', time: 1000 * 60 * 5 })
            .then(async (i) => {
                if (!i.isButton()) return;

                switch (i.customId) {
                    case 'configPinsEnable':
                        config.enablePins = true;
                        await config.save();
                        await this.render(i, filter);
                        break;
                    case 'configPinsDisable':
                        config.enablePins = false;
                        await config.save();
                        await this.render(i, filter);
                        break;
                    case 'configPinsBack':
                        await OverviewView.render(i, filter);
                        break;
                }
            })
            .catch(async () => await message.edit({ components: [] }));
    }
}
