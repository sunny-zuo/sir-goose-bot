import {
    ComponentType,
    Guild,
    Message,
    ActionRowBuilder,
    MessageComponentInteraction,
    EmbedBuilder,
    StringSelectMenuBuilder,
    inlineCode,
    ChatInputCommandInteraction,
} from 'discord.js';
import { PinsView } from './pinsView';
import { ModlogView } from './modlogView';
import { VerificationView } from './verificationView';
import { Emojis } from '#util/constants';
import { GuildConfigCache } from '#util/guildConfigCache';
import { logger } from '#util/logger';

export class OverviewView {
    static readonly optionSelectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder().setCustomId('configSelect').setOptions([
            {
                label: 'View Options',
                value: 'configView',
                description: 'Display the value of every configuration option.',
                emoji: '🔍',
                default: true,
            },
            {
                label: 'Verification',
                value: 'configVerification',
                description: "Configure role assignment based on users' UWaterloo ID.",
                emoji: '✅',
            },
            {
                label: 'Modlog',
                value: 'configModlog',
                description: 'Toggle moderation logging, and set the modlog channel.',
                emoji: '📖',
            },
            {
                label: 'Pins',
                value: 'configPins',
                description: 'Toggle the ability for all users to pin messages.',
                emoji: '📌',
            },
        ])
    );

    static async render(interaction: MessageComponentInteraction, filter: (i: MessageComponentInteraction) => boolean): Promise<void> {
        await interaction.update({
            embeds: [await this.generateConfigViewEmbed(interaction.guild!)],
            components: [this.optionSelectMenu],
        });

        await this.listenForViewSelect(interaction.message, filter);
    }

    static async initialRender(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();
        const configMenu = await interaction.editReply({
            embeds: [await this.generateConfigViewEmbed(interaction.guild!)],
            components: [this.optionSelectMenu],
        });

        const filter = (i: MessageComponentInteraction) => {
            if (i.user.id === interaction.user.id) return true;
            else {
                i.reply({
                    embeds: [new EmbedBuilder().setDescription("This dropdown isn't for you!").setColor('Red')],
                    ephemeral: true,
                }).catch((e) => logger.error(e, e.message));
                return false;
            }
        };

        await this.listenForViewSelect(configMenu, filter);
    }

    static async generateConfigViewEmbed(guild: Guild): Promise<EmbedBuilder> {
        const { enableModlog, modlogChannelId, enablePins, enableVerification } = await GuildConfigCache.fetchOrCreate(guild.id);

        const maxInfoLabelLength = 15;
        const enabledString = `${Emojis.GreenCheck} Enabled`;
        const disabledString = `${Emojis.RedCross} Disabled`;

        const embed = new EmbedBuilder()
            .setTitle(`Bot Config for ${guild.name}`)
            .setColor('Blue')
            .setDescription(
                `${this.formatLabel('Verification', maxInfoLabelLength)} ${enableVerification ? enabledString : disabledString}
                ${this.formatLabel('Modlog', maxInfoLabelLength)} ${enableModlog ? enabledString : disabledString}
                ${this.formatLabel('Modlog Channel', maxInfoLabelLength)} ${modlogChannelId ? `<#${modlogChannelId}>` : 'no channel set'}
                ${this.formatLabel('Pins', maxInfoLabelLength)} ${enablePins ? enabledString : disabledString}
                `
            )
            .setTimestamp();

        return embed;
    }

    static async listenForViewSelect(message: Message, filter: (i: MessageComponentInteraction) => boolean): Promise<void> {
        await message
            .awaitMessageComponent({ filter, componentType: ComponentType.StringSelect, time: 1000 * 60 * 5 })
            .then(async (i) => {
                if (!i.isStringSelectMenu()) return;

                switch (i.values[0]) {
                    case 'configVerification':
                        await VerificationView.render(i, filter);
                        break;
                    case 'configModlog':
                        await ModlogView.render(i, filter);
                        break;
                    case 'configPins':
                        await PinsView.render(i, filter);
                        break;
                    default:
                        throw new Error('Invalid config option selected');
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

    static formatLabel(label: string, length: number): string {
        return inlineCode(`${label.padStart(length)}:`) + ' ';
    }
}
