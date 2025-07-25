import { AES } from 'crypto-js';
import {
    ButtonInteraction,
    InteractionReplyOptions,
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    MessageReplyOptions,
    Role,
    User,
    ButtonStyle,
    ChatInputCommandInteraction,
} from 'discord.js';
import UserModel from '#models/user.model';
import Client from '#src/Client';
import { RoleAssignmentService } from '../services/roleAssignmentService';
import { Modlog } from './modlog';
import { VerificationRuleImportV2, VerificationRules } from '#types/Verification';

export function getVerificationResponse(user: User, isReverify = false): InteractionReplyOptions & MessageReplyOptions {
    if (!process.env.AES_PASSPHRASE || !process.env.SERVER_URI) {
        throw new Error('Verification URL settings are unset');
    }

    const encodedUserId = AES.encrypt(`${user.id}-sebot`, process.env.AES_PASSPHRASE).toString().replace(/\//g, '_').replace(/\+/g, '-');
    const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setLabel('Verify').setStyle(ButtonStyle.Link).setURL(`${process.env.SERVER_URI}/verify/${encodedUserId}`),
        new ButtonBuilder().setCustomId('verificationLearnMore').setLabel('Learn More').setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
        .setTitle('Verification Link')
        .setColor('Blue')
        .setDescription(
            `Click the button below and login with your UWaterloo account to ${isReverify ? 'reverify' : 'verify'}.
                        
                Authorization allows us to read your profile information to confirm that you are/were a UW student, and you can revoke this permission at any time.
                If you run into issues, message the server admins or [join the support server](https://discord.gg/KHByMmrrw2) for help!`
        );

    return { embeds: [embed], components: [button] };
}

export async function sendVerificationReplies(
    client: Client,
    interaction: ChatInputCommandInteraction | ButtonInteraction,
    discordUser: User
): Promise<void> {
    const user = await UserModel.findOne({ discordId: discordUser.id });

    if (user?.verified && user?.department && user?.o365CreatedDate) {
        const service = new RoleAssignmentService(discordUser.id);
        let assignedRoles: Role[] = [];
        if (interaction.guild) {
            const roleAssign = await service.assignGuildRoles(interaction.guild, { log: true, returnMissing: false });
            if (roleAssign.success) {
                ({ assignedRoles } = roleAssign.value);
            } else if (roleAssign.error === 'User is banned') {
                const embed = new EmbedBuilder()
                    .setTitle('Banned')
                    .setDescription(
                        `You are banned from this server, and thus cannot receive any roles. Please message a server admin if you think this is a mistake or wish to appeal your ban.`
                    )
                    .setColor('Red')
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
                return;
            }
        } else {
            await service.assignAllRoles(client);
        }

        const assignmentResult =
            assignedRoles.length > 0
                ? `You have received the ${assignedRoles.map((role) => `\`${role.name}\``).join(', ')} role(s).`
                : 'However, the server has configured the bot to not assign any roles to you (most likely due to only wanting to verify certain groups of people). If you think this is a mistake, please message a server admin.';

        const embed = new EmbedBuilder()
            .setTitle('Verified Successfully')
            .setDescription(`You've been sucessfully verified! ${assignmentResult}`)
            .setColor('Green')
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
    } else {
        if (user) {
            user.verifyRequestedAt = new Date();
            user.verifyRequestedServerId = interaction.guild?.id ?? '-1';
            await user.save();
        } else {
            await UserModel.create({
                discordId: discordUser.id,
                verified: false,
                verifyRequestedAt: new Date(),
                verifyRequestedServerId: interaction.guild?.id ?? '-1',
            });
        }

        await safeSendVerificationEmbed(interaction, discordUser);
    }
}

type SafeSendVerificationEmbedOptions = { isReverify?: boolean };

export async function safeSendVerificationEmbed(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
    discordUser: User,
    options: SafeSendVerificationEmbedOptions = {}
) {
    const verifyReply = getVerificationResponse(discordUser, options.isReverify);

    try {
        if (interaction.guild) {
            await discordUser.send(verifyReply);

            const embed = new EmbedBuilder()
                .setTitle('Verification Link Sent')
                .setDescription("We've sent you a verification link via direct message. Please check your DMs!")
                .setColor('Blue')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            await Modlog.logUserAction(interaction.guild, discordUser, `${discordUser} requested a verification link.`, 'Blue');
        } else {
            await interaction.editReply(verifyReply);
        }
    } catch (err) {
        const embed = new EmbedBuilder()
            .setTitle('Unable to Send Verification Link')
            .setDescription(
                'We were unable to DM you a verification link. Please temporarily [change your privacy settings](https://support.discord.com/hc/en-us/articles/217916488-Blocking-Privacy-Settings) to allow direct messages from server members in order to verify, or DM me with the `/verify` command directly.'
            )
            .setColor('Red')
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
}

export function serializeVerificationRules(verificationRules: VerificationRules | undefined): string {
    if (!verificationRules) {
        return '';
    }

    const serializedRules: VerificationRuleImportV2[] = [];

    for (const rule of verificationRules.rules) {
        const serializedRule: VerificationRuleImportV2 = {
            roles: rule.roles.map((role) => role.name),
            department: rule.department,
            match: rule.matchType,
            yearMatch: rule.yearMatch,
            year: rule.year,
        };

        serializedRules.push(serializedRule);
    }

    return JSON.stringify({ v: 2, rules: serializedRules });
}
