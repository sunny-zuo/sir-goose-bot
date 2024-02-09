import {
    ActionRowBuilder,
    ButtonBuilder,
    MessageComponentInteraction,
    EmbedBuilder,
    ButtonStyle,
    ComponentType,
    bold,
    codeBlock,
} from 'discord.js';
import { GuildConfigCache } from '#util/guildConfigCache';
import { serializeVerificationRules } from '#util/verification';
import { OverviewView } from './overviewView';
import { Emojis } from '#util/constants';

export class VerificationView {
    static async render(interaction: MessageComponentInteraction, filter: (i: MessageComponentInteraction) => boolean): Promise<void> {
        const config = await GuildConfigCache.fetchOrCreate(interaction.guildId!);

        const embed = new EmbedBuilder()
            .setTitle('Verification Configuration')
            .setDescription(
                `${config.enableVerification ? Emojis.GreenCheck : Emojis.RedCross} Verification is currently ${
                    config.enableVerification ? bold('enabled') : bold('disabled')
                }.
                
                ${
                    config.verificationRules
                        ? 'Verification rules are set.'
                        : `No verification rules are set, so ${bold(
                              'verification currently has no effect'
                          )}. [Create a ruleset here](https://sebot.sunnyzuo.com/)!`
                }`
            )
            .setColor('Blue')
            .setTimestamp();

        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId('configVerificationEnable')
                .setStyle(ButtonStyle.Success)
                .setLabel('Enable')
                .setDisabled(config.enableVerification),
            new ButtonBuilder()
                .setCustomId('configVerificationDisable')
                .setStyle(ButtonStyle.Danger)
                .setLabel('Disable')
                .setDisabled(!config.enableVerification),
            new ButtonBuilder().setCustomId('configVerificationViewRules').setStyle(ButtonStyle.Primary).setLabel('View Rules'),
            new ButtonBuilder().setCustomId('configVerificationSetRules').setStyle(ButtonStyle.Primary).setLabel('Update Rules')
        );

        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel('Read the Verification Guide')
                .setURL('https://sir-goose.notion.site/sir-goose/Setting-Up-Verification-0f309b2a00fc4e198b5f2182d2452fcd'),
            new ButtonBuilder().setCustomId('configVerificationBack').setStyle(ButtonStyle.Secondary).setLabel('Back')
        );

        await interaction.update({ embeds: [embed], components: [row1, row2] });

        const message = interaction.message;

        const buttonCollector = message.createMessageComponentCollector({
            filter,
            componentType: ComponentType.Button,
            time: 1000 * 60 * 5,
        });

        buttonCollector.on('collect', async (i) => {
            switch (i.customId) {
                case 'configVerificationEnable':
                    config.enableVerification = true;
                    await config.save();
                    buttonCollector.stop('completed');
                    await VerificationView.render(i, filter);
                    break;
                case 'configVerificationDisable':
                    config.enableVerification = false;
                    await config.save();
                    buttonCollector.stop('completed');
                    await VerificationView.render(i, filter);
                    break;
                case 'configVerificationViewRules': {
                    const embed = new EmbedBuilder().setColor('Blue').setTitle('Verification Rules')
                        .setDescription(`[Create a new ruleset](https://sebot.sunnyzuo.com/). Current rules:
                            ${codeBlock(serializeVerificationRules(config.verificationRules))}`);

                    await i.reply({ embeds: [embed], ephemeral: true });
                    break;
                }
                case 'configVerificationSetRules': {
                    const embed = new EmbedBuilder()
                        .setColor('Yellow')
                        .setDescription(
                            'Verification rules currently cannot be edited in this menu. Please use the `/verifyrules` command for now.'
                        );

                    await i.reply({ embeds: [embed], ephemeral: true });
                    break;
                }
                case 'configVerificationBack':
                    buttonCollector.stop('completed');
                    await OverviewView.render(i, filter);
                    break;
            }
        });

        buttonCollector.on('end', async (_, reason) => {
            if (reason !== 'completed') {
                await message.edit({ components: [] });
            }
        });
    }
}
