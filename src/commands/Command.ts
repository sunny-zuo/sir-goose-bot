import { GuildMember, Message, MessageEmbed, Permissions, CommandInteraction, DMChannel } from 'discord.js';
import { CommandOptions } from '../types/CommandOptions';
import Client from '../Client';
import { TextBasedChannel, GuildTextBasedChannel } from '../types';

const minimumClientPermissions = [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS];

export abstract class Command {
    client: Client;
    name: string;
    description: string;
    aliases: Array<string> = [];
    args: boolean = false;
    guildOnly: boolean = false;
    ownerOnly: boolean = false;
    displayHelp: boolean = true;
    enabled: boolean = true;
    usage: string = '';
    examples: string = '';
    clientPermissions: Array<bigint> = minimumClientPermissions;
    userPermissions: Array<bigint> = [];

    constructor(client: Client, options: CommandOptions) {
        this.client = client;

        Object.keys(options).forEach((key) => options[key] === undefined && delete options[key]);
        Object.assign(this, options);

        this.name = options.name;
        this.description = options.description;
    }

    abstract execute(interaction: Message | CommandInteraction, args: string): Promise<void>;

    checkMessageCommandPermissions(message: Message) {
        if (message.channel.type === 'dm') return true;
        if (
            message.channel.guild.me &&
            !message.channel.permissionsFor(message.channel.guild.me).has(minimumClientPermissions)
        ) {
            return false;
        }

        return (
            this.checkClientPermissions(message.channel) && this.checkMemberPermissions(message.member, message.channel)
        );
    }

    checkMemberPermissions(member: GuildMember | null, channel: GuildTextBasedChannel, ownerOverride = true) {
        if (member === null) return false;
        if (!this.ownerOnly && !this.userPermissions.length) return true;
        if (ownerOverride && this.client.isOwner(member.user)) return true;
        if (this.ownerOnly && !this.client.isOwner(member.user)) return false;

        const missingPermissions = channel.permissionsFor(member).missing(this.userPermissions);

        if (missingPermissions.length === 0) return true;

        const embed = new MessageEmbed()
            .setTitle('Missing Permissions')
            .setColor('RED')
            .setDescription(
                `You must have the following permissions to use this command:
                ${missingPermissions}`
            )
            .setTimestamp();

        channel.send({ embeds: [embed] });
    }

    checkClientPermissions(channel: GuildTextBasedChannel) {
        if (channel.guild.me === null) return false;
        const missingPermissions = channel.permissionsFor(channel.guild.me).missing(this.clientPermissions);

        if (missingPermissions.length === 0) return true;

        const embed = new MessageEmbed()
            .setTitle('Bot Missing Permissions')
            .setColor('RED')
            .setDescription(
                `The bot requires the following permissions to run this command:
                ${missingPermissions}`
            )
            .setTimestamp();

        channel.send({ embeds: [embed] });
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
}
