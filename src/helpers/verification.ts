import { AES } from 'crypto-js';
import {
    ButtonInteraction,
    CommandInteraction,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    MessageOptions,
    Role,
    User,
} from 'discord.js';
import UserModel from '../models/user.model';
import Client from '../Client';
import { RoleAssignmentService } from '../services/roleAssignmentService';
import { Modlog } from './modlog';
import { sendEphemeralReply, sendReply } from './message';

export function getVerificationResponse(user: User): MessageOptions {
    if (!process.env.AES_PASSPHRASE || !process.env.SERVER_URI) {
        throw new Error('Verification URL settings are unset');
    }

    const encodedUserId = AES.encrypt(`${user.id}-sebot`, process.env.AES_PASSPHRASE).toString().replace(/\//g, '_').replace(/\+/g, '-');
    const button = new MessageActionRow().addComponents(
        new MessageButton().setLabel('Verify').setStyle('LINK').setURL(`${process.env.SERVER_URI}/verify/${encodedUserId}`),
        new MessageButton().setCustomId('verificationLearnMore').setLabel('Learn More').setStyle('SECONDARY')
    );

    const embed = new MessageEmbed()
        .setTitle('Verification Link')
        .setColor('BLUE')
        .setDescription(
            `Click the button below and login with your UWaterloo account to verify.
                        
                Authorization allows us to read your profile information to confirm that you are/were a UW student, and you can revoke this permission at any time.
                If you run into issues, message the server admins or ${process.env.OWNER_DISCORD_USERNAME} for help!`
        );

    return { embeds: [embed], components: [button] };
}

export async function sendVerificationReplies(
    client: Client,
    interaction: Message | CommandInteraction | ButtonInteraction,
    discordUser: User,
    ephemeral = false
): Promise<void> {
    const user = await UserModel.findOne({ discordId: discordUser.id });

    if (user?.verified && user?.department && user?.o365CreatedDate) {
        const service = new RoleAssignmentService(client, discordUser.id);
        let assignedRoles: Role[] = [];
        if (interaction.guild) {
            const roleAssign = await service.assignGuildRoles(interaction.guild, true, false);
            if (roleAssign.success) {
                ({ assignedRoles } = roleAssign.value);
            } else if (roleAssign.error === 'User is banned') {
                const embed = new MessageEmbed()
                    .setTitle('Banned')
                    .setDescription(
                        `You are banned from thie server, and thus cannot receive any roles. Please message a server admin if you think this is a mistake or wish to appeal your ban.`
                    )
                    .setColor('RED')
                    .setTimestamp();

                ephemeral
                    ? await sendEphemeralReply(interaction, { embeds: [embed] }, 60)
                    : await sendReply(interaction, { embeds: [embed] });
            }
        } else {
            await service.assignAllRoles();
        }

        const assignmentResult =
            assignedRoles.length > 0
                ? `You have received the ${assignedRoles.map((role) => `\`${role.name}\``).join(', ')} role(s).`
                : 'However, the server has configured the bot to not assign any roles to you (most likely due to only wanting to verify certain groups of people). If you think this is a mistake, please message a server admin.';

        const embed = new MessageEmbed()
            .setTitle('Verified Successfully')
            .setDescription(`You've been sucessfully verified! ${assignmentResult}`)
            .setColor('GREEN')
            .setTimestamp();

        ephemeral ? await sendEphemeralReply(interaction, { embeds: [embed] }, 60) : await sendReply(interaction, { embeds: [embed] });
    } else {
        if (user) {
            user.verifyRequestedAt = new Date();
            user.verifyRequestedServerId = interaction.guild?.id ?? '-1';
            user.save();
        } else {
            await UserModel.create({
                discordId: discordUser.id,
                verified: false,
                verifyRequestedAt: new Date(),
                verifyRequestedServerId: interaction.guild?.id ?? '-1',
            });
        }

        const verifyReply = getVerificationResponse(discordUser);

        try {
            if (interaction.guild) {
                await discordUser.send(verifyReply);

                const embed = new MessageEmbed()
                    .setTitle('Verification Link Sent')
                    .setDescription("We've sent you a verification link via direct message. Please check your DMs!")
                    .setColor('BLUE')
                    .setTimestamp();

                ephemeral
                    ? await sendEphemeralReply(interaction, { embeds: [embed] }, 60)
                    : await sendReply(interaction, { embeds: [embed] });

                Modlog.logUserAction(client, interaction.guild, discordUser, `${discordUser} requested a verification link.`, 'BLUE');
            } else {
                await sendReply(interaction, verifyReply);
            }
        } catch (err) {
            const embed = new MessageEmbed()
                .setTitle('Unable to Send Verification Link')
                .setDescription(
                    'We were unable to DM you a verification link. Please [temporarily change your privacy settings](https://cdn.discordapp.com/attachments/811741914340393000/820114337514651658/permissions.png) to allow direct messages from server members in order to verify.'
                )
                .setColor('RED')
                .setTimestamp();

            ephemeral ? await sendEphemeralReply(interaction, { embeds: [embed] }, 60) : await sendReply(interaction, { embeds: [embed] });
        }
    }
}
