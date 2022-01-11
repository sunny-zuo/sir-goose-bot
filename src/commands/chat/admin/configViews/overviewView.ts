import {
    CommandInteraction,
    Guild,
    Message,
    MessageActionRow,
    MessageComponentInteraction,
    MessageEmbed,
    MessageSelectMenu,
} from 'discord.js';
import { GuildConfigCache } from '../../../../helpers/guildConfigCache';
import { PrefixView } from './prefixView';
import { PinsView } from './pinsView';
import { ModlogView } from './modlogView';
import { VerificationView } from './verificationView';
import Client from '../../../../Client';

export class OverviewView {
    static readonly optionSelectMenu = new MessageActionRow().addComponents(
        new MessageSelectMenu().setCustomId('configSelect').setOptions([
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
            {
                label: 'Prefix',
                value: 'configPrefix',
                description: 'View or modify the prefix that the bot will respond to.',
                emoji: '👂',
            },
        ])
    );

    static async render(interaction: MessageComponentInteraction, filter: (i: MessageComponentInteraction) => boolean): Promise<void> {
        await interaction.update({
            embeds: [await this.generateConfigViewEmbed(interaction.guild!)],
            components: [this.optionSelectMenu],
            fetchReply: true,
        });

        await this.listenForViewSelect(interaction.message as Message, filter);
    }

    static async initialRender(client: Client, interaction: CommandInteraction): Promise<void> {
        const configMenu = (await interaction.reply({
            embeds: [await this.generateConfigViewEmbed(interaction.guild!)],
            components: [this.optionSelectMenu],
            fetchReply: true,
        })) as Message;

        const filter = (i: MessageComponentInteraction) => {
            if (i.user.id === interaction.user.id) return true;
            else {
                // TODO: refactor logging to remove the need to pass client around
                i.reply({
                    embeds: [new MessageEmbed().setDescription("This dropdown isn't for you!").setColor('RED')],
                    ephemeral: true,
                }).catch((e) => client.log.error(`Error responding to invalid component interaction: ${e}`));
                return false;
            }
        };

        await this.listenForViewSelect(configMenu, filter);
    }

    static async generateConfigViewEmbed(guild: Guild): Promise<MessageEmbed> {
        const { prefix, enableModlog, modlogChannelId, enablePins, enableVerification } = await GuildConfigCache.fetchOrCreate(guild.id);
        const embed = new MessageEmbed()
            .setTitle(`Bot Config for ${guild.name}`)
            .setColor('BLUE')
            .setDescription(
                `Here are the values of every bot configuration option. Use the dropdown below to find out more about each individual option and to modify options.`
            )
            .addFields(
                {
                    name: 'Prefix',
                    value: prefix,
                    inline: true,
                },
                {
                    name: 'Verification',
                    value: enableVerification ? 'Enabled' : 'Disabled',
                    inline: true,
                },
                {
                    name: 'Moderation Logging',
                    value: enableModlog
                        ? `Enabled.\nModlog Channel: ${modlogChannelId ? `<#${modlogChannelId}>` : 'no channel set'}`
                        : 'Disabled',
                    inline: true,
                },
                {
                    name: 'Pins',
                    value: enablePins ? 'Enabled' : 'Disabled',
                    inline: true,
                }
            )
            .setTimestamp();

        return embed;
    }

    static async listenForViewSelect(message: Message, filter: (i: MessageComponentInteraction) => boolean): Promise<void> {
        await message
            .awaitMessageComponent({ filter, componentType: 'SELECT_MENU', time: 1000 * 60 * 5 })
            .then(async (i) => {
                if (!i.isSelectMenu()) return;

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
                    case 'configPrefix':
                        await PrefixView.render(i, filter);
                        break;
                }
            })
            .catch(async () => await message.edit({ components: [] }));
    }
}
