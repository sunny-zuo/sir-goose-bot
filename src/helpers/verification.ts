import { AES } from 'crypto-js';
import { MessageActionRow, MessageButton, MessageEmbed, MessageOptions, User } from 'discord.js';

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
