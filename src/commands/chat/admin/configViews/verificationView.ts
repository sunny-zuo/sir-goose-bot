import { Message, MessageActionRow, MessageButton, MessageComponentInteraction, MessageEmbed } from 'discord.js';
import { GuildConfigCache } from '#util/guildConfigCache';
import { serializeVerificationRules } from '#util/verification';
import { OverviewView } from './overviewView';
import { bold, codeBlock } from '@discordjs/builders';
import { Emojis } from '#util/constants';

export class VerificationView {
    static async render(interaction: MessageComponentInteraction, filter: (i: MessageComponentInteraction) => boolean): Promise<void> {
        const config = await GuildConfigCache.fetchOrCreate(interaction.guildId!);

        const embed = new MessageEmbed()
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
            .setColor('BLUE')
            .setTimestamp();

        const row1 = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId('configVerificationEnable')
                .setStyle('SUCCESS')
                .setLabel('Enable')
                .setDisabled(config.enableVerification),
            new MessageButton()
                .setCustomId('configVerificationDisable')
                .setStyle('DANGER')
                .setLabel('Disable')
                .setDisabled(!config.enableVerification),
            new MessageButton().setCustomId('configVerificationViewRules').setStyle('PRIMARY').setLabel('View Rules'),
            new MessageButton().setCustomId('configVerificationSetRules').setStyle('PRIMARY').setLabel('Update Rules')
        );

        const row2 = new MessageActionRow().addComponents(
            new MessageButton()
                .setStyle('LINK')
                .setLabel('Read the Verification Guide')
                .setURL('https://sir-goose.notion.site/sir-goose/Setting-Up-Verification-0f309b2a00fc4e198b5f2182d2452fcd'),
            new MessageButton().setCustomId('configVerificationBack').setStyle('SECONDARY').setLabel('Back')
        );

        await interaction.update({ embeds: [embed], components: [row1, row2] });

        const message = interaction.message as Message;

        const buttonCollector = message.createMessageComponentCollector({ filter, componentType: 'BUTTON', time: 1000 * 60 * 5 });

        buttonCollector.on('collect', async (i) => {
            switch (i.customId) {
                case 'configVerificationEnable':
                    config.enableVerification = true;
                    await config.save();
                    buttonCollector.stop('completed');
                    await this.render(i, filter);
                    break;
                case 'configVerificationDisable':
                    config.enableVerification = false;
                    await config.save();
                    buttonCollector.stop('completed');
                    await this.render(i, filter);
                    break;
                case 'configVerificationViewRules': {
                    const embed = new MessageEmbed().setColor('BLUE').setTitle('Verification Rules')
                        .setDescription(`[Create a new ruleset](https://sebot.sunnyzuo.com/). Current rules:
                            ${codeBlock(serializeVerificationRules(config.verificationRules))}`);

                    await i.reply({ embeds: [embed], ephemeral: true });
                    break;
                }
                case 'configVerificationSetRules': {
                    const embed = new MessageEmbed()
                        .setColor('YELLOW')
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
