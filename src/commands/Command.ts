import {
    GuildMember,
    Message,
    MessageEmbed,
    Permissions,
    CommandInteraction,
    DMChannel,
    ApplicationCommandOption,
    CommandInteractionOption,
    Collection,
    User,
    Snowflake,
    Role,
    GuildChannel,
} from 'discord.js';
import { CommandOptions, Category } from '../types/Command';
import Client from '../Client';
import { TextBasedChannel, GuildTextBasedChannel, Result, InvalidCommandInteractionOption, ArgumentIssue } from '../types';

const minimumClientPermissions = [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS];

export abstract class Command {
    client: Client;
    name: string;
    description: string;
    category: Category;
    isSlashCommand: boolean = true;
    isMessageCommand: boolean = true;
    aliases: Array<string> = [];
    options: Array<ApplicationCommandOption> = [];
    guildOnly: boolean = false;
    ownerOnly: boolean = false;
    displayHelp: boolean = true;
    enabled: boolean = true;
    examples: string = '';
    clientPermissions: Array<bigint> = minimumClientPermissions;
    userPermissions: Array<bigint> = [];

    constructor(client: Client, options: CommandOptions) {
        this.client = client;

        Object.keys(options).forEach((key) => options[key] === undefined && delete options[key]);
        Object.assign(this, options);

        this.name = options.name;
        this.description = options.description;
        this.category = options.category;
    }

    abstract execute(interaction: Message | CommandInteraction, args?: Collection<string, CommandInteractionOption>): Promise<void>;

    async parseMessageArguments(
        interaction: Message | CommandInteraction,
        args: string
    ): Promise<Result<Collection<string, CommandInteractionOption>, InvalidCommandInteractionOption>> {
        const options = new Collection<string, CommandInteractionOption>();
        const expectedOptions = this.options;
        const stringArgs = args.trim().split(' ').values(); // TODO: handle arguments with spaces

        for (const expectedOption of expectedOptions) {
            const stringArg = stringArgs.next().value;
            const commandInteractionOption: CommandInteractionOption = {
                name: expectedOption.name,
                type: expectedOption.type,
            };

            if (stringArg === undefined) {
                if (expectedOption.required) {
                    return { success: false, error: this.parseMessageArgumentsError(commandInteractionOption, ArgumentIssue.MISSING) };
                } else {
                    return { success: true, value: options };
                }
            }

            switch (expectedOption.type) {
                case 'STRING':
                    commandInteractionOption.value = stringArg;
                    break;
                case 'INTEGER':
                    const val = Math.round(Number(stringArg));
                    if (isNaN(val)) {
                        return {
                            success: false,
                            error: this.parseMessageArgumentsError(commandInteractionOption, ArgumentIssue.INVALID_TYPE),
                        };
                    }

                    commandInteractionOption.value = val;
                    break;
                case 'BOOLEAN':
                    if (stringArg === 'true') commandInteractionOption.value = true;
                    else if (stringArg === 'false') commandInteractionOption.value = false;
                    else {
                        return {
                            success: false,
                            error: this.parseMessageArgumentsError(commandInteractionOption, ArgumentIssue.INVALD_CHOICE),
                        };
                    }

                    break;
                case 'USER':
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
                case 'CHANNEL':
                    const channel = await this.getChannelFromMention(interaction, stringArg);
                    if (!channel) {
                        return {
                            success: false,
                            error: this.parseMessageArgumentsError(commandInteractionOption, ArgumentIssue.INVALID_TYPE),
                        };
                    }

                    commandInteractionOption.channel = channel;
                    break;
                case 'ROLE':
                    const role = await this.getRoleFromMention(interaction, stringArg);
                    if (!role) {
                        return {
                            success: false,
                            error: this.parseMessageArgumentsError(commandInteractionOption, ArgumentIssue.INVALID_TYPE),
                        };
                    }

                    commandInteractionOption.role = role;
                    break;
                case 'MENTIONABLE':
                case 'SUB_COMMAND':
                case 'SUB_COMMAND_GROUP':
                    throw new Error(`Option type ${expectedOption.type} is currently unsupported.`);
            }

            options.set(expectedOption.name, commandInteractionOption);
        }

        return { success: true, value: options };
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
        const user = await interaction.guild?.members.fetch(id);

        return user;
    }

    async getRoleFromMention(interaction: Message | CommandInteraction, mention: string): Promise<Role | undefined | null> {
        const matches = mention.match(/^<@&(\d+)>$/);
        if (!matches) return undefined;
        const id = matches[1] as Snowflake;
        const role = await interaction.guild?.roles.fetch(id);
        return role;
    }

    async getChannelFromMention(interaction: Message | CommandInteraction, mention: string): Promise<GuildChannel | undefined | null> {
        const matches = mention.match(/^<#(\d+)>$/);
        if (!matches) return undefined;
        const id = matches[1] as Snowflake;
        const channel = await interaction.guild?.channels.fetch(id);
        return channel;
    }

    checkCommandPermissions(interaction: Message | CommandInteraction) {
        if (!interaction.channel) return false;
        if (interaction.channel.type === 'dm' || interaction.member === null) return true;
        if (
            interaction.channel.guild.me &&
            !interaction.channel.permissionsFor(interaction.channel.guild.me).has(minimumClientPermissions)
        ) {
            return false;
        }

        if (interaction.member && interaction.member instanceof GuildMember) {
            return (
                this.checkClientPermissions(interaction.channel, interaction) &&
                this.checkMemberPermissions(interaction.member, interaction.channel, interaction)
            );
        } else {
            // this code would be ran if a bot user is not in the guild, and we would have an APIInteractionGuildMember
            // https://discord.com/developers/docs/resources/guild#guild-member-object
            // for now, we consider this behavior unsupported and return false
            this.client.log.warn(
                `Command was ran from guild ${interaction.guild!.name} (${interaction.guild!.id}) where the bot user isn't present`
            );
            return false;
        }
    }

    checkMemberPermissions(
        member: GuildMember | null,
        channel: GuildTextBasedChannel,
        interaction: Message | CommandInteraction | null = null,
        ownerOverride = true
    ) {
        if (member === null) return false;
        if (!this.ownerOnly && !this.userPermissions.length) return true;
        if (ownerOverride && this.client.isOwner(member.user)) return true;
        if (this.ownerOnly && !this.client.isOwner(member.user)) {
            if (interaction) {
                this.sendErrorEmbed(interaction, 'Missing Permissions', `This command can only be used by the bot owner.`);
            }
            return false;
        }

        const missingPermissions = channel.permissionsFor(member).missing(this.userPermissions);

        if (missingPermissions.length === 0) return true;

        if (interaction) {
            this.sendErrorEmbed(
                interaction,
                'Missing Permissions',
                `You must have the following permissions to use this command:
                ${missingPermissions.map((p) => `\`${p}\``).join(', ')}`
            );
        }
    }

    checkClientPermissions(channel: GuildTextBasedChannel, interaction: Message | CommandInteraction | null = null) {
        if (channel.guild.me === null) return false;
        const missingPermissions = channel.permissionsFor(channel.guild.me).missing(this.clientPermissions);

        if (missingPermissions.length === 0) return true;

        if (interaction) {
            this.sendErrorEmbed(
                interaction,
                'Bot Missing Permissions',
                `The bot requires the following permissions to run this command:
                ${missingPermissions.map((p) => `\`${p}\``).join(', ')}`
            );
        }
    }

    getValidChannel(channel: TextBasedChannel | null): Promise<TextBasedChannel> {
        return new Promise(async (resolve, reject) => {
            if (channel !== null) {
                if (channel instanceof DMChannel) {
                    const dmChannel = channel as DMChannel;
                    if (dmChannel.partial) {
                        const fullChannel = await dmChannel.fetch();
                        resolve(fullChannel);
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

    sendErrorEmbed(interaction: Message | CommandInteraction, title: string, description: string) {
        const embed = new MessageEmbed().setTitle(title).setColor('RED').setDescription(description).setTimestamp();

        return interaction.reply({ embeds: [embed] }).catch((error) => {
            this.client.log.error(error, error.stack);
        });
    }
}
