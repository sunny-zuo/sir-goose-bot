import {
    GuildMember,
    Message,
    EmbedBuilder,
    PermissionsBitField,
    ChatInputCommandInteraction,
    ApplicationCommandOption,
    CommandInteractionOption,
    User,
    Snowflake,
    Role,
    ColorResolvable,
    CommandInteractionOptionResolver,
    GuildBasedChannel,
    ApplicationCommandOptionType,
    MessageContextMenuCommandInteraction,
    UserContextMenuCommandInteraction,
} from 'discord.js';
import { CommandOptions, Category } from '#types/Command';
import Client from '#src/Client';
import { Result, InvalidCommandInteractionOption, ArgumentIssue } from '../types';
import { Cooldown } from '#util/cooldown';
import { isMessage } from '#util/message';
import { getUser } from '#util/user';
import { sendEphemeralReply } from '#util/message';
import { logger } from '#util/logger';

const minimumClientPermissions = [
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.EmbedLinks,
];

export abstract class Command {
    client: Client;
    name: string;
    description?: string;
    category?: Category;
    isSlashCommand?: boolean;
    isTextCommand?: boolean;
    isMessageContextMenuCommand?: boolean;
    isUserContextMenuCommand?: boolean;
    aliases: string[] = [];
    options: ApplicationCommandOption[] = [];
    guildOnly = false;
    ownerOnly = false;
    displayHelp = true;
    enabled = true;
    examples: string[] = [];
    clientPermissions: bigint[] = minimumClientPermissions;
    userPermissions: bigint[] = [];
    cooldownSeconds = 3;
    cooldownMaxUses = 1;
    cooldown: Cooldown;

    constructor(client: Client, options: CommandOptions) {
        this.client = client;

        Object.keys(options).forEach((key) => options[key] === undefined && delete options[key]);
        Object.assign(this, options);

        this.name = options.name;
        this.cooldown = new Cooldown(this.cooldownSeconds, this.cooldownMaxUses);
    }

    isRateLimited(userId: Snowflake): boolean {
        return this.cooldown.checkLimit(userId).blocked;
    }

    async parseMessageValue(
        interaction: Message | ChatInputCommandInteraction,
        expectedOption: ApplicationCommandOption,
        argArray: string[]
    ): Promise<Result<CommandInteractionOption, InvalidCommandInteractionOption>> {
        const stringArg = argArray.shift();
        const commandInteractionOption: CommandInteractionOption = {
            name: expectedOption.name,
            type: expectedOption.type,
        };

        if (stringArg === undefined) {
            return { success: false, error: this.parseMessageArgumentsError(commandInteractionOption, ArgumentIssue.MISSING) };
        }

        switch (expectedOption.type) {
            case ApplicationCommandOptionType.String:
                commandInteractionOption.value = stringArg;
                break;
            case ApplicationCommandOptionType.Integer: {
                const val = Math.round(Number(stringArg));
                if (isNaN(val)) {
                    return {
                        success: false,
                        error: this.parseMessageArgumentsError(commandInteractionOption, ArgumentIssue.INVALID_TYPE),
                    };
                }

                commandInteractionOption.value = val;
                break;
            }
            case ApplicationCommandOptionType.Boolean: {
                if (stringArg === 'true') commandInteractionOption.value = true;
                else if (stringArg === 'false') commandInteractionOption.value = false;
                else {
                    return {
                        success: false,
                        error: this.parseMessageArgumentsError(commandInteractionOption, ArgumentIssue.INVALD_CHOICE),
                    };
                }

                break;
            }
            case ApplicationCommandOptionType.User: {
                const user = await this.getUserFromMention(interaction, stringArg);
                if (user === undefined) {
                    return {
                        success: false,
                        error: this.parseMessageArgumentsError(commandInteractionOption, ArgumentIssue.INVALID_TYPE),
                    };
                }

                commandInteractionOption.user = user;

                const member = await this.getMemberFromMention(interaction, stringArg);
                if (member) commandInteractionOption.member = member;

                break;
            }
            case ApplicationCommandOptionType.Channel: {
                const channel = await this.getChannelFromMention(interaction, stringArg);
                if (!channel) {
                    return {
                        success: false,
                        error: this.parseMessageArgumentsError(commandInteractionOption, ArgumentIssue.INVALID_TYPE),
                    };
                }

                commandInteractionOption.channel = channel;
                break;
            }
            case ApplicationCommandOptionType.Role: {
                const role = await this.getRoleFromMention(interaction, stringArg);
                if (!role) {
                    return {
                        success: false,
                        error: this.parseMessageArgumentsError(commandInteractionOption, ArgumentIssue.INVALID_TYPE),
                    };
                }

                commandInteractionOption.role = role;
                break;
            }
            case ApplicationCommandOptionType.Subcommand:
            case ApplicationCommandOptionType.SubcommandGroup: {
                if (expectedOption.name === stringArg.toLowerCase()) {
                    const suboptions: CommandInteractionOption[] = [];

                    if (expectedOption.options === undefined) {
                        commandInteractionOption.options = suboptions;
                        return { success: true, value: commandInteractionOption };
                    }
                    for (const suboption of expectedOption.options) {
                        const tempArgArray =
                            this.isLastOption(suboption, expectedOption.options) && argArray.length ? [argArray.join(' ')] : argArray;
                        const result = await this.parseMessageValue(interaction, suboption, tempArgArray);
                        if (!result.success) {
                            if (result.error.issue === ArgumentIssue.MISSING) {
                                if (
                                    expectedOption.type === ApplicationCommandOptionType.Subcommand ||
                                    expectedOption.type === ApplicationCommandOptionType.SubcommandGroup
                                ) {
                                    continue;
                                } else {
                                    break;
                                }
                            } else {
                                return { success: false, error: result.error };
                            }
                        }
                        suboptions.push(result.value);
                    }

                    commandInteractionOption.options = suboptions;
                } else {
                    argArray.unshift(stringArg);
                    return { success: false, error: this.parseMessageArgumentsError(commandInteractionOption, ArgumentIssue.MISSING) };
                }

                break;
            }
            case ApplicationCommandOptionType.Mentionable:
                throw new Error(`Option type ${expectedOption.type} is currently unsupported.`);
        }

        return { success: true, value: commandInteractionOption };
    }

    async parseMessageArguments(
        interaction: Message | ChatInputCommandInteraction,
        args: string
    ): Promise<Result<CommandInteractionOptionResolver, InvalidCommandInteractionOption>> {
        const options: CommandInteractionOption[] = [];
        const expectedOptions = this.options;
        const argArray =
            expectedOptions.length > 1 ||
            expectedOptions[0].type === ApplicationCommandOptionType.Subcommand ||
            expectedOptions[0].type === ApplicationCommandOptionType.SubcommandGroup
                ? args.trim().split(' ')
                : [args.trim()]; // TODO: handle arguments with spaces

        for (const expectedOption of expectedOptions) {
            const tempArgArray = this.isLastOption(expectedOption, expectedOptions) && argArray.length ? [argArray.join(' ')] : argArray;
            const result = await this.parseMessageValue(interaction, expectedOption, tempArgArray);
            if (!result.success) {
                if (result.error.issue === ArgumentIssue.MISSING) {
                    if (
                        expectedOption.type === ApplicationCommandOptionType.Subcommand ||
                        expectedOption.type === ApplicationCommandOptionType.SubcommandGroup
                    ) {
                        continue;
                    } else if (expectedOption.required) {
                        return { success: false, error: result.error };
                    } else {
                        // @ts-expect-error - we rely on creating our own CommandInteractionOptionResolver to easily support text and slash commands
                        return { success: true, value: new CommandInteractionOptionResolver(interaction.client, options) };
                    }
                } else {
                    return { success: false, error: result.error };
                }
            }
            options.push(result.value);
        }
        // @ts-expect-error - we rely on creating our own CommandInteractionOptionResolver to easily support text and slash commands
        return { success: true, value: new CommandInteractionOptionResolver(interaction.client, options) };
    }

    isLastOption(option: ApplicationCommandOption, options: readonly ApplicationCommandOption[]): boolean {
        if (
            option.type === ApplicationCommandOptionType.SubcommandGroup ||
            (option.type === ApplicationCommandOptionType.Subcommand && option.options?.length)
        )
            return false;
        else if (option.type === ApplicationCommandOptionType.Subcommand) return true;
        else if (option === options.slice(-1)[0]) return true;
        else return false;
    }

    parseMessageArgumentsError(option: CommandInteractionOption, issue: ArgumentIssue): InvalidCommandInteractionOption {
        const invalidOption = option as InvalidCommandInteractionOption;
        invalidOption.issue = issue;

        return invalidOption;
    }

    async getUserFromMention(interaction: Message | ChatInputCommandInteraction, mention: string): Promise<User | undefined> {
        const matches = mention.match(/^<@!?(\d+)>$/);
        if (!matches) return undefined;
        const id = matches[1] as Snowflake;
        const user = await interaction.client.users.fetch(id);

        return user;
    }

    async getMemberFromMention(interaction: Message | ChatInputCommandInteraction, mention: string): Promise<GuildMember | undefined> {
        const matches = mention.match(/^<@!?(\d+)>$/);
        if (!matches) return undefined;
        const id = matches[1] as Snowflake;
        const user = await interaction.guild?.members.fetch(id).catch(() => undefined);

        return user;
    }

    async getRoleFromMention(interaction: Message | ChatInputCommandInteraction, mention: string): Promise<Role | undefined | null> {
        const matches = mention.match(/^<@&(\d+)>$/);
        if (!matches) return null;
        const id = matches[1] as Snowflake;
        const role = await interaction.guild?.roles.fetch(id).catch(() => null);
        return role;
    }

    async getChannelFromMention(
        interaction: Message | ChatInputCommandInteraction,
        mention: string
    ): Promise<GuildBasedChannel | undefined | null> {
        const matches = mention.match(/^<#(\d+)>$/);
        if (!matches) return null;
        const id = matches[1] as Snowflake;
        const channel = await interaction.guild?.channels.fetch(id).catch(() => null);
        return channel;
    }

    async checkCommandPermissions(
        interaction: Message | ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction
    ): Promise<boolean> {
        if (!interaction.channel) return false;
        if (interaction.channel.isDMBased() || interaction.member === null) return true;
        if (
            interaction.channel.guild.members.me &&
            !interaction.channel.permissionsFor(interaction.channel.guild.members.me).has(minimumClientPermissions)
        ) {
            return false;
        }

        if (interaction.member && interaction.member instanceof GuildMember) {
            if (interaction.channel.isThread()) {
                const parentId = interaction.channel.parentId;
                if (!parentId) return false; // should only be null if bot user can't view channel or bot user does not exist

                const parentChannel = await interaction.channel.guild.channels.fetch(parentId).catch(() => null);
                if (!parentChannel) return false;

                return (
                    (await this.checkClientPermissions(parentChannel, interaction)) &&
                    (await this.checkMemberPermissions(interaction.member, parentChannel, interaction))
                );
            } else {
                return (
                    (await this.checkClientPermissions(interaction.channel, interaction)) &&
                    (await this.checkMemberPermissions(interaction.member, interaction.channel, interaction))
                );
            }
        } else {
            // this code would be ran if a bot user is not in the guild, and we would have an APIInteractionGuildMember
            // https://discord.com/developers/docs/resources/guild#guild-member-object
            // for now, we consider this behavior unsupported and return false
            logger.warn(
                {
                    command: { name: this.name, type: isMessage(interaction) ? 'MESSAGE' : interaction.type },
                    guild: { name: interaction.guild?.name, id: interaction.guild?.id },
                    userId: getUser(interaction).id,
                },
                "Command was ran from a guild where the bot user isn't present"
            );
            return false;
        }
    }

    async checkMemberPermissions(
        member: GuildMember | null,
        channel: GuildBasedChannel,
        interaction:
            | Message
            | ChatInputCommandInteraction
            | MessageContextMenuCommandInteraction
            | UserContextMenuCommandInteraction
            | null = null,
        ownerOverride = true
    ): Promise<boolean> {
        if (member === null) return false;
        if (!this.ownerOnly && !this.userPermissions.length) return true;
        if (ownerOverride && this.client.isOwner(member.user)) return true;
        if (this.ownerOnly && !this.client.isOwner(member.user)) {
            if (interaction) {
                await this.sendErrorEmbed(interaction, 'Missing Permissions', `This command can only be used by the bot owner.`);
            }
            return false;
        }

        const missingPermissions = channel.permissionsFor(member).missing(this.userPermissions);

        if (missingPermissions.length === 0) return true;

        if (interaction) {
            await this.sendErrorEmbed(
                interaction,
                'Missing Permissions',
                `You must have the following permissions to use this command:
                ${missingPermissions.map((p) => `\`${p}\``).join(', ')}`
            );
        }

        return false;
    }

    async checkClientPermissions(
        channel: GuildBasedChannel,
        interaction:
            | Message
            | ChatInputCommandInteraction
            | MessageContextMenuCommandInteraction
            | UserContextMenuCommandInteraction
            | null = null
    ): Promise<boolean> {
        if (channel.guild.members.me === null) return false;
        const missingPermissions = channel.permissionsFor(channel.guild.members.me).missing(this.clientPermissions);

        if (missingPermissions.length === 0) return true;

        if (interaction) {
            await this.sendErrorEmbed(
                interaction,
                'Bot Missing Permissions',
                `The bot requires the following permissions to run this command:
                ${missingPermissions.map((p) => `\`${p}\``).join(', ')}`
            );
        }

        return false;
    }

    sendSuccessEmbed(
        interaction: Message | ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction,
        title: string,
        description: string,
        ephemeral = false,
        deletionSeconds = 30
    ): Promise<unknown> {
        return this.sendColorEmbed(interaction, 'Green', title, description, ephemeral, deletionSeconds);
    }

    sendNeutralEmbed(
        interaction: Message | ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction,
        title: string,
        description: string,
        ephemeral = false,
        deletionSeconds = 30
    ): Promise<unknown> {
        return this.sendColorEmbed(interaction, 'Blue', title, description, ephemeral, deletionSeconds);
    }

    sendErrorEmbed(
        interaction: Message | ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction,
        title: string,
        description: string,
        ephemeral = false,
        deletionSeconds = 30
    ): Promise<unknown> {
        return this.sendColorEmbed(interaction, 'Red', title, description, ephemeral, deletionSeconds);
    }

    sendColorEmbed(
        interaction: Message | ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction,
        color: ColorResolvable,
        title: string,
        description: string,
        ephemeral = false,
        deletionSeconds = 30
    ): Promise<unknown> {
        const embed = new EmbedBuilder().setTitle(title).setColor(color).setDescription(description).setTimestamp();

        if (ephemeral) {
            return sendEphemeralReply(interaction, { embeds: [embed] }, deletionSeconds);
        } else {
            return interaction.reply({ embeds: [embed] });
        }
    }

    isMessage = isMessage;

    getUser = getUser;
}
