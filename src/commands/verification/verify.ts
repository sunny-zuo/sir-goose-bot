import { CommandInteraction, Message } from 'discord.js';
import Client from '../../Client';
import { Command } from '../Command';
import { GuildConfigCache } from '../../helpers/guildConfigCache';
import UserModel from '../../models/user.model';
import { getVerificationResponse } from '../../helpers/verification';

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

            const verifyReply = getVerificationResponse(discordUser);

            try {
                if (interaction.guild) {
                    discordUser.send(verifyReply);

                    this.sendNeutralEmbed(
                        interaction,
                        'Verification Link Sent',
                        "We've sent you a verification link via direct message. Please check your DMs!"
                    );
                } else {
                    interaction.reply(verifyReply);
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
