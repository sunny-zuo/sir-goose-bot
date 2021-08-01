import { CommandInteraction, Message, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import { AES } from 'crypto-js';
import Client from '../../Client';
import { Command } from '../Command';
import { GuildConfigCache } from '../../helpers/guildConfigCache';
import UserModel from '../../models/user.model';

export class Verify extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'verify',
            description: 'Verify your UW identity to receive roles',
            category: 'Verification',
        });
    }

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        const config = await GuildConfigCache.fetchConfig(interaction.guild?.id);
        if (interaction.guild && config.enableVerification === false) {
            return this.sendErrorEmbed(interaction, 'Verification Not Enabled', 'This server does not have verification enabled.');
        }

        const discordUser = this.isMessage(interaction) ? interaction.author : interaction.user;

        if (!discordUser) return;
        if (!process.env.AES_PASSPHRASE || !process.env.SERVER_URI) {
            throw new Error('Verification URL settings are unset');
        }

        const encodedUserId = AES.encrypt(`${discordUser.id}-sebot`, process.env.AES_PASSPHRASE)
            .toString()
            .replace(/\//g, '_')
            .replace(/\+/g, '-');
        const user = await UserModel.findOne({ discordId: discordUser.id });

        if (user?.verified) {
            // TODO: Assign roles
            this.sendSuccessEmbed(interaction, 'Verified Successfully', "You've been sucessfully verified!");
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

            try {
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

                if (interaction.guild) {
                    discordUser.send({ embeds: [embed], components: [button] });

                    this.sendNeutralEmbed(
                        interaction,
                        'Verification Link Sent',
                        "We've sent you a verification link via direct message. Please check your DMs!"
                    );
                } else {
                    interaction.reply({ embeds: [embed], components: [button] });
                }
            } catch (err) {
                this.sendErrorEmbed(
                    interaction,
                    'Unable to DM',
                    'We were unable to DM you a verification link. Please [temporarily change your privacy settings](https://cdn.discordapp.com/attachments/811741914340393000/820114337514651658/permissions.png) to allow direct messages from server members in order to verify.'
                );
            }
        }
    }
}
