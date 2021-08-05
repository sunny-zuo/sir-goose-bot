import { AES } from 'crypto-js';
import {
    ButtonInteraction,
    CommandInteraction,
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    MessageOptions,
    User,
} from 'discord.js';
import UserModel from '../models/user.model';
import Client from '../Client';
import { RoleAssignmentService } from '../services/roleAssignmentService';
import { Modlog } from './modlog';

export function getVerificationResponse(user: User): MessageOptions {
    if (!process.env.AES_PASSPHRASE || !process.env.SERVER_URI) {
        throw new Error('Verification URL settings are unset');
    }

    const encodedUserId = AES.encrypt(`${user.id}-sebot`, process.env.AES_PASSPHRASE).toString().replace(/\//g, '_').replace(/\+/g, '-');
    const button = new MessageActionRow().addComponents(
        new MessageButton().setLabel('Verify').setStyle('LINK').setURL(`${process.env.SERVER_URI}/verify/${encodedUserId}`)
    );

    const embed = new MessageEmbed()
        .setTitle('Verification Link')
        .setColor('BLUE')
        .setDescription(
            `Click the button below and login with your UWaterloo account to verify.
                        
                Authorization allows us to read your profile information to confirm that you are/were a UW student, and you can revoke this permission at any time.
                If you run into issues, message ${process.env.OWNER_DISCORD_USERNAME} for help!`
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
        const roleAssign = new RoleAssignmentService(client, discordUser.id);
        if (interaction.guild) {
            await roleAssign.assignGuildRoles(interaction.guild);
        } else {
            await roleAssign.assignAllRoles();
        }

        const embed = new MessageEmbed()
            .setTitle('Verified Successfully')
            .setDescription("You've been sucessfully verified!")
            .setColor('GREEN')
            .setTimestamp();

        isMessage(interaction) ? interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed], ephemeral: ephemeral });
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

                isMessage(interaction)
                    ? interaction.reply({ embeds: [embed] })
                    : interaction.reply({ embeds: [embed], ephemeral: ephemeral });

                Modlog.logUserAction(client, interaction.guild, discordUser, `${user} requested a verification link.`, 'BLUE');
            } else {
                if (isMessage(interaction) || interaction.isCommand()) {
                    interaction.reply(verifyReply);
                }
            }
        } catch (err) {
            const embed = new MessageEmbed()
                .setTitle('Unable to Send Verification Link')
                .setDescription(
                    'We were unable to DM you a verification link. Please [temporarily change your privacy settings](https://cdn.discordapp.com/attachments/811741914340393000/820114337514651658/permissions.png) to allow direct messages from server members in order to verify.'
                )
                .setColor('RED')
                .setTimestamp();

            isMessage(interaction) ? interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed], ephemeral: ephemeral });
        }
    }
}

function isMessage(interaction: Message | CommandInteraction | ButtonInteraction): interaction is Message {
    return (interaction as Message).url !== undefined;
}
