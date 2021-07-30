import {
    ApplicationCommandOption,
    Collection,
    CommandInteraction,
    CommandInteractionOption,
    Message,
    MessageEmbed,
    Permissions,
} from 'discord.js';
import Client from '../../Client';
import { GuildConfigCache } from '../../helpers/guildConfigCache';
import { Command } from '../Command';

export class Config extends Command {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'prefix',
            description: 'View or set the prefix the bot will respond to.',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'prefix',
                    description: 'Enter the new prefix. Maxmimum 5 characters.',
                    type: 'STRING',
                },
            ],
        },
        {
            name: 'modlog_channel',
            description: 'View or set the text channel the bot will send modlogs to.',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'channel',
                    description: 'Set the text channel the bot will send modlogs to.',
                    type: 'CHANNEL',
                },
            ],
        },
        {
            name: 'enable_modlog',
            description: 'View or set whether not modlog should be enabled.',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'value',
                    description: 'Enter the new value to set. Either true or false.',
                    type: 'BOOLEAN',
                },
            ],
        },
        {
            name: 'enable_verification',
            description: 'View or set whether not verification should be enabled',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'value',
                    description: 'Enter the new value to set. Either true or false.',
                    type: 'BOOLEAN',
                },
            ],
        },
        {
            name: 'enable_pins',
            description: 'Enabling pins allows users to use the pin command to pin a message',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'value',
                    description: 'Enter the new value to set. Either true or false.',
                    type: 'BOOLEAN',
                },
            ],
        },
        {
            name: 'view',
            description: 'View all config values',
            type: 'SUB_COMMAND',
        },
    ];

    constructor(client: Client) {
        super(client, {
            name: 'config',
            description: "View or edit the server's bot configuration.",
            category: 'Admin',
            options: Config.options,
            aliases: ['cfg', 'configuration'],
            guildOnly: true,
            examples: ['config', 'config prefix $'],
            userPermissions: [Permissions.FLAGS.MANAGE_GUILD],
        });
    }

    async execute(interaction: CommandInteraction | Message, args?: Collection<string, CommandInteractionOption>): Promise<void> {
        const guildConfig = await GuildConfigCache.fetchOrCreate(interaction.guild!.id);

        if (args && args.size > 0) {
            if (args.has('prefix')) {
                const options = args.get('prefix')?.options;
                const prefix = options?.get('prefix')?.value as string;

                if (prefix) {
                    if (prefix.length > 5) {
                        this.sendErrorEmbed(interaction, 'Invalid Prefix', 'Prefix must be between 1 and 5 characters long.');
                        return;
                    }

                    guildConfig.prefix = prefix;
                    await guildConfig.save();

                    this.sendSuccessEmbed(interaction, 'Prefix Updated', `The prefix has been set to \`${prefix}\``);
                    return;
                } else {
                    this.sendNeutralEmbed(
                        interaction,
                        'Prefix',
                        `The prefix the bot will respond to is currently \`${guildConfig.prefix}\`. You can also use Discord slash commands!`
                    );
                    return;
                }
            }
            if (args.has('modlog_channel')) {
                const options = args.get('modlog_channel')?.options;
                const providedChannel = options?.get('channel')?.channel;

                if (providedChannel) {
                    const channel = await interaction.guild!.channels.fetch(providedChannel.id);

                    if (channel && channel.isText()) {
                        guildConfig.modlogChannelId = channel.id;
                        await guildConfig.save();

                        this.sendSuccessEmbed(
                            interaction,
                            'Modlog Channel',
                            `The modlog channel has been set to ${channel}. Modlog is currently ${
                                guildConfig.enableModlog
                                    ? 'enabled.'
                                    : `disabled - use \`${guildConfig.prefix}config enable_modlog true\` to enable.`
                            }`
                        );
                        return;
                    } else {
                        this.sendErrorEmbed(
                            interaction,
                            'Invalid Modlog Channel',
                            'The modlog channel was not found, or was not a text channel.'
                        );
                        return;
                    }
                } else {
                    this.sendNeutralEmbed(
                        interaction,
                        'Modlog Channel',
                        `The modlog channel is the channel that modlog messages get sent to, and is currently ${
                            guildConfig.modlogChannelId ? `set to <#${guildConfig.modlogChannelId}>` : 'unset'
                        }. Modlog is currently ${guildConfig.enableModlog ? 'enabled' : 'disabled'}.`
                    );
                    return;
                }
            }
            if (args.has('enable_modlog')) {
                const options = args.get('enable_modlog')?.options;

                if (options?.get('value')?.value !== undefined) {
                    const enable = Boolean(options?.get('value')?.value);

                    guildConfig.enableModlog = enable;
                    await guildConfig.save();

                    this.sendSuccessEmbed(
                        interaction,
                        `${guildConfig.enableModlog ? 'Modlog Enabled' : 'Modlog Disabled'}`,
                        `Modlog is now ${
                            enable
                                ? `enabled, and the modlog channel is ${
                                      guildConfig.modlogChannelId ? `set to <#${guildConfig.modlogChannelId}>` : 'unset'
                                  }.\nUse \`${guildConfig.prefix}config <modlog_channel> <new_channel>\` to set a channel.`
                                : 'disabled.'
                        }`
                    );
                    return;
                } else {
                    this.sendNeutralEmbed(
                        interaction,
                        'Modlog Status',
                        `Modlog is currently ${
                            guildConfig.enableModlog ? 'enabled' : 'disabled'
                        }. When enabled, the bot will send logs of server management related actions to a specified channel.`
                    );
                    return;
                }
            }
            if (args.has('enable_verification')) {
                const options = args.get('enable_verification')?.options;
                const enable = options?.get('value')?.value as boolean;

                if (enable !== undefined) {
                    guildConfig.enableVerification = enable;
                    await guildConfig.save();

                    this.sendSuccessEmbed(
                        interaction,
                        `Verification ${enable ? 'Enabled' : 'Disabled'}`,
                        `Verification is now ${enable ? 'enabled' : 'disabled'}.`
                    );
                    return;
                } else {
                    this.sendNeutralEmbed(
                        interaction,
                        'Verification Status',
                        `Verification is currently **${
                            guildConfig.enableVerification ? 'enabled' : 'disabled'
                        }**. When verification is enabled, users will be able to use the \`verify\` command to authenticate with their UWaterloo account and receive roles based on rules configurable with the \`verifyrules\` command.`
                    );
                    return;
                }
            }
            if (args.has('enable_pins')) {
                const options = args.get('enable_pins')?.options;
                const enable = options?.get('value')?.value as boolean;
                if (enable !== undefined) {
                    guildConfig.enablePins = enable;
                    await guildConfig.save();

                    this.sendSuccessEmbed(
                        interaction,
                        `Pins ${enable ? 'Enabled' : 'Disabled'}`,
                        `Pinning is now ${enable ? 'enabled' : 'disabled'}.`
                    );
                    return;
                } else {
                    this.sendNeutralEmbed(
                        interaction,
                        'Pin Status',
                        `Pinning is currently ${
                            guildConfig.enableVerification ? 'enabled' : 'disabled'
                        }. When enabled, users are able to reply to a message with \`${guildConfig.prefix}pin\` to pin the message.`
                    );
                    return;
                }
            }
            if (args.has('view')) {
                const embed = new MessageEmbed()
                    .setTitle(`Bot Config for ${interaction.guild!.name}`)
                    .setColor('BLUE')
                    .setDescription(
                        `Use \`${guildConfig.prefix}config <option_name>\` to learn more about an option.
                            Use \`${guildConfig.prefix}config <option_name> <new_value>\` to update the guild config.
                            For example, \`${guildConfig.prefix}verification_enabled true\` would turn on verification.`
                    )
                    .addFields(
                        {
                            name: 'prefix',
                            value: guildConfig.prefix,
                            inline: true,
                        },
                        {
                            name: 'enable_modlog',
                            value: guildConfig.enableModlog.toString(),
                            inline: true,
                        },
                        {
                            name: 'modlog_channel',
                            value: guildConfig.modlogChannelId ? `<#${guildConfig.modlogChannelId}>` : 'unset',
                            inline: true,
                        },
                        {
                            name: 'enable_pins',
                            value: guildConfig.enablePins.toString(),
                            inline: true,
                        },
                        {
                            name: 'enable_verification',
                            value: guildConfig.enableVerification.toString(),
                            inline: true,
                        },
                        {
                            name: 'verification_rules',
                            value: `View with ${guildConfig.prefix}verifyrules`,
                            inline: true,
                        }
                    )
                    .setTimestamp();

                interaction.reply({ embeds: [embed] });
            }
        } else {
            this.sendErrorEmbed(
                interaction,
                'No arguments provided.',
                `Use \`${guildConfig.prefix}config view\` to view the server config.`
            );
        }
    }
}
