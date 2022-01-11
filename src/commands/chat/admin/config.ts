import {
    ApplicationCommandOption,
    CommandInteraction,
    CommandInteractionOptionResolver,
    Message,
    MessageEmbed,
    Permissions,
} from 'discord.js';
import Client from '../../../Client';
import { GuildConfigCache } from '../../../helpers/guildConfigCache';
import { ChatCommand } from '../ChatCommand';

export class Config extends ChatCommand {
    private static readonly options: ApplicationCommandOption[] = [
        {
            name: 'prefix',
            description: 'View or set the prefix the bot will respond to.',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'new_prefix',
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
                    channelTypes: ['GUILD_TEXT'],
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
            examples: ['view', 'prefix $'],
            userPermissions: [Permissions.FLAGS.MANAGE_GUILD],
        });
    }

    async execute(
        interaction: CommandInteraction | Message,
        args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        const guildConfig = await GuildConfigCache.fetchOrCreate(interaction.guild!.id);

        const subcommand = args?.getSubcommand(false);

        if (args && subcommand) {
            switch (subcommand) {
                case 'prefix': {
                    const prefix = args.getString('new_prefix');

                    if (prefix) {
                        if (prefix.length > 5) {
                            await this.sendErrorEmbed(interaction, 'Invalid Prefix', 'Prefix must be between 1 and 5 characters long.');
                            return;
                        }

                        guildConfig.prefix = prefix;
                        await guildConfig.save();

                        await this.sendSuccessEmbed(interaction, 'Prefix Updated', `The prefix has been set to \`${prefix}\``);
                        return;
                    } else {
                        await this.sendNeutralEmbed(
                            interaction,
                            'Prefix',
                            `The prefix the bot will respond to is currently \`${guildConfig.prefix}\`. You can also use Discord slash commands!`
                        );
                        return;
                    }
                }
                case 'modlog_channel': {
                    const providedChannel = args.getChannel('channel');

                    if (providedChannel) {
                        const channel = await interaction.guild!.channels.fetch(providedChannel.id);

                        if (channel && channel.viewable && interaction.guild?.me) {
                            if (
                                channel
                                    .permissionsFor(interaction.guild.me)
                                    .has([Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS])
                            ) {
                                guildConfig.modlogChannelId = channel.id;
                                await guildConfig.save();

                                await this.sendSuccessEmbed(
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
                                await this.sendErrorEmbed(
                                    interaction,
                                    'Invalid Modlog Channel',
                                    'I do not have permission to send messages and embed links in the modlog channel you provided.'
                                );
                                return;
                            }
                        } else {
                            await this.sendErrorEmbed(
                                interaction,
                                'Invalid Modlog Channel',
                                'The modlog channel was not found. Make sure that I have access to view the channel you selected.'
                            );
                            return;
                        }
                    } else {
                        await this.sendNeutralEmbed(
                            interaction,
                            'Modlog Channel',
                            `The modlog channel is the channel that modlog messages get sent to, and is currently ${
                                guildConfig.modlogChannelId ? `set to <#${guildConfig.modlogChannelId}>` : 'unset'
                            }. Modlog is currently ${guildConfig.enableModlog ? 'enabled' : 'disabled'}.`
                        );
                        return;
                    }
                }
                case 'enable_modlog': {
                    const enable = args.getBoolean('value');

                    if (enable !== null) {
                        guildConfig.enableModlog = enable;
                        await guildConfig.save();

                        await this.sendSuccessEmbed(
                            interaction,
                            `${guildConfig.enableModlog ? 'Modlog Enabled' : 'Modlog Disabled'}`,
                            `Modlog is now ${
                                enable
                                    ? `enabled, and the modlog channel is ${
                                          guildConfig.modlogChannelId ? `set to <#${guildConfig.modlogChannelId}>` : 'unset'
                                      }.\nUse \`${guildConfig.prefix}config modlog_channel <new_channel>\` to set a channel.`
                                    : 'disabled.'
                            }`
                        );
                        return;
                    } else {
                        await this.sendNeutralEmbed(
                            interaction,
                            'Modlog Status',
                            `Modlog is currently ${
                                guildConfig.enableModlog ? 'enabled' : 'disabled'
                            }. When enabled, the bot will send logs of server management related actions to a specified channel.`
                        );
                        return;
                    }
                }
                case 'enable_verification': {
                    const enable = args.getBoolean('value');

                    if (enable !== null) {
                        guildConfig.enableVerification = enable;
                        await guildConfig.save();

                        await this.sendSuccessEmbed(
                            interaction,
                            `Verification ${enable ? 'Enabled' : 'Disabled'}`,
                            `Verification is now ${enable ? 'enabled' : 'disabled'}.`
                        );
                        return;
                    } else {
                        await this.sendNeutralEmbed(
                            interaction,
                            'Verification Status',
                            `Verification is currently **${
                                guildConfig.enableVerification ? 'enabled' : 'disabled'
                            }**. When verification is enabled, users will be able to use the \`verify\` command to authenticate with their UWaterloo account and receive roles based on rules configurable with the \`verifyrules\` command.`
                        );
                        return;
                    }
                }
                case 'enable_pins': {
                    const enable = args.getBoolean('value');

                    if (enable !== null) {
                        guildConfig.enablePins = enable;
                        await guildConfig.save();

                        await this.sendSuccessEmbed(
                            interaction,
                            `Pins ${enable ? 'Enabled' : 'Disabled'}`,
                            `Pinning is now ${enable ? 'enabled' : 'disabled'}.`
                        );
                        return;
                    } else {
                        await this.sendNeutralEmbed(
                            interaction,
                            'Pin Status',
                            `Pinning is currently ${
                                guildConfig.enableVerification ? 'enabled' : 'disabled'
                            }. When enabled, users are able to reply to a message with \`${guildConfig.prefix}pin\` to pin the message.`
                        );
                        return;
                    }
                }
                case 'view': {
                    const embed = new MessageEmbed()
                        .setTitle(`Bot Config for ${interaction.guild!.name}`)
                        .setColor('BLUE')
                        .setDescription(
                            `Use \`${guildConfig.prefix}config <option_name>\` to learn more about an option.
                            Use \`${guildConfig.prefix}config <option_name> <new_value>\` to update the guild config.
                            For example, \`${guildConfig.prefix}config verification_enabled true\` would turn on verification.`
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

                    await interaction.reply({ embeds: [embed] });
                }
            }
        } else {
            await this.sendErrorEmbed(
                interaction,
                'No valid arguments provided.',
                `Use \`${guildConfig.prefix}config view\` to view the server config and learn how to edit the server's configuration.`
            );
        }
    }
}
