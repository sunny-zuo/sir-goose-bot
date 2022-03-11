import {
    GuildMember,
    Message,
    MessageEmbed,
    Permissions,
    CommandInteraction,
    ApplicationCommandOption,
    CommandInteractionOption,
    User,
    Snowflake,
    Role,
    ColorResolvable,
    CommandInteractionOptionResolver,
    ContextMenuInteraction,
    TextBasedChannel,
    GuildBasedChannel,
} from 'discord.js';
import { CommandOptions, Category } from '#types/Command';
import Client from '#src/Client';
import { GuildTextBasedChannel, Result, InvalidCommandInteractionOption, ArgumentIssue } from '../types';
import { Cooldown } from '#util/cooldown';
import { isMessage } from '#util/message';
import { getUser } from '#util/user';
import { sendEphemeralReply } from '#util/message';
import { logger } from '#util/logger';

const minimumClientPermissions = [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS];

export abstract class Command {
    client: Client;
    name: string;
    description?: string;
    category?: Category;
    isSlashCommand?: boolean;
    isTextCommand?: boolean;
    isContextMenuCommand?: boolean;
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
        interaction: Message | CommandInteraction,
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
            case 'STRING':
                commandInteractionOption.value = stringArg;
                break;
            case 'INTEGER': {
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
            case 'BOOLEAN': {
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
            case 'USER': {
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
            case 'CHANNEL': {
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
            case 'ROLE': {
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
            case 'SUB_COMMAND':
            case 'SUB_COMMAND_GROUP': {
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
                                if (expectedOption.type === 'SUB_COMMAND' || expectedOption.type === 'SUB_COMMAND_GROUP') {
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

            case 'MENTIONABLE':
                throw new Error(`Option type ${expectedOption.type} is currently unsupported.`);
        }

        return { success: true, value: commandInteractionOption };
    }

    async parseMessageArguments(
        interaction: Message | CommandInteraction,
        args: string
    ): Promise<Result<CommandInteractionOptionResolver, InvalidCommandInteractionOption>> {
        const options: CommandInteractionOption[] = [];
        const expectedOptions = this.options;
        const argArray =
            expectedOptions.length > 1 || expectedOptions[0].type === 'SUB_COMMAND' || expectedOptions[0].type === 'SUB_COMMAND_GROUP'
                ? args.trim().split(' ')
                : [args.trim()]; // TODO: handle arguments with spaces

        for (const expectedOption of expectedOptions) {
            const tempArgArray = this.isLastOption(expectedOption, expectedOptions) && argArray.length ? [argArray.join(' ')] : argArray;
            const result = await this.parseMessageValue(interaction, expectedOption, tempArgArray);
            if (!result.success) {
                if (result.error.issue === ArgumentIssue.MISSING) {
                    if (expectedOption.type === 'SUB_COMMAND' || expectedOption.type === 'SUB_COMMAND_GROUP') {
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

    isLastOption(option: ApplicationCommandOption, options: ApplicationCommandOption[]): boolean {
        if (option.type === 'SUB_COMMAND_GROUP' || (option.type === 'SUB_COMMAND' && option.options?.length)) return false;
        else if (option.type === 'SUB_COMMAND') return true;
        else if (option === options.slice(-1)[0]) return true;
        else return false;
    }

    parseMessageArgumentsError(option: CommandInteractionOption, issue: ArgumentIssue): InvalidCommandInteractionOption {
        const invalidOption = option as InvalidCommandInteractionOption;
        invalidOption.issue = issue;

        return invalidOption;
    }

    async getUserFromMention(interaction: Message | CommandInteraction, mention: string): Promise<User | undefined> {
        const matches = mention.match(/^<@!?(\d+)>$/);
        if (!matches) return undefined;
        const id = matches[1] as Snowflake;
        const user = await interaction.client.users.fetch(id);

        return user;
    }

    async getMemberFromMention(interaction: Message | CommandInteraction, mention: string): Promise<GuildMember | undefined> {
        const matches = mention.match(/^<@!?(\d+)>$/);
        if (!matches) return undefined;
        const id = matches[1] as Snowflake;
        const user = await interaction.guild?.members.fetch(id).catch(() => undefined);

        return user;
    }

    async getRoleFromMention(interaction: Message | CommandInteraction, mention: string): Promise<Role | undefined | null> {
        const matches = mention.match(/^<@&(\d+)>$/);
        if (!matches) return undefined;
        const id = matches[1] as Snowflake;
        const role = await interaction.guild?.roles.fetch(id);
        return role;
    }

    async getChannelFromMention(interaction: Message | CommandInteraction, mention: string): Promise<GuildBasedChannel | undefined | null> {
        const matches = mention.match(/^<#(\d+)>$/);
        if (!matches) return undefined;
        const id = matches[1] as Snowflake;
        const channel = await interaction.guild?.channels.fetch(id);
        return channel;
    }

    async checkCommandPermissions(interaction: Message | CommandInteraction | ContextMenuInteraction): Promise<boolean> {
        if (!interaction.channel) return false;
        if (interaction.channel.type === 'DM' || interaction.member === null) return true;
        if (
            interaction.channel.guild.me &&
            !interaction.channel.permissionsFor(interaction.channel.guild.me).has(minimumClientPermissions)
        ) {
            return false;
        }

        if (interaction.member && interaction.member instanceof GuildMember) {
            return (
                (await this.checkClientPermissions(interaction.channel, interaction)) &&
                (await this.checkMemberPermissions(interaction.member, interaction.channel, interaction))
            );
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
        channel: GuildTextBasedChannel,
        interaction: Message | CommandInteraction | ContextMenuInteraction | null = null,
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
        channel: GuildTextBasedChannel,
        interaction: Message | CommandInteraction | ContextMenuInteraction | null = null
    ): Promise<boolean> {
        if (channel.guild.me === null) return false;
        const missingPermissions = channel.permissionsFor(channel.guild.me).missing(this.clientPermissions);

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

    getValidChannel(channel: TextBasedChannel | null): Promise<TextBasedChannel> {
        return new Promise((resolve, reject) => {
            if (channel !== null) {
                if (channel.type === 'DM') {
                    const dmChannel = channel;
                    if (dmChannel.partial) {
                        resolve(dmChannel.fetch());
                    }
                }

                resolve(channel);
            } else {
                reject(
                    new Error(
                        `Command "${this.name}" failed to fetch valid channel - this is likely because a slash command was used without the bot user existing in a guild`
                    )
                );
            }
        });
    }

    sendSuccessEmbed(
        interaction: Message | CommandInteraction | ContextMenuInteraction,
        title: string,
        description: string,
        ephemeral = false,
        deletionSeconds = 30
    ): Promise<void | Message> {
        return this.sendColorEmbed(interaction, 'GREEN', title, description, ephemeral, deletionSeconds);
    }

    sendNeutralEmbed(
        interaction: Message | CommandInteraction | ContextMenuInteraction,
        title: string,
        description: string,
        ephemeral = false,
        deletionSeconds = 30
    ): Promise<void | Message> {
        return this.sendColorEmbed(interaction, 'BLUE', title, description, ephemeral, deletionSeconds);
    }

    sendErrorEmbed(
        interaction: Message | CommandInteraction | ContextMenuInteraction,
        title: string,
        description: string,
        ephemeral = false,
        deletionSeconds = 30
    ): Promise<void | Message> {
        return this.sendColorEmbed(interaction, 'RED', title, description, ephemeral, deletionSeconds);
    }

    sendColorEmbed(
        interaction: Message | CommandInteraction | ContextMenuInteraction,
        color: ColorResolvable,
        title: string,
        description: string,
        ephemeral = false,
        deletionSeconds = 30
    ): Promise<void | Message> {
        const embed = new MessageEmbed().setTitle(title).setColor(color).setDescription(description).setTimestamp();

        if (ephemeral) {
            return sendEphemeralReply(interaction, { embeds: [embed] }, deletionSeconds);
        } else {
            return interaction.reply({ embeds: [embed] });
        }
    }

    isMessage = isMessage;

    getUser = getUser;
}
