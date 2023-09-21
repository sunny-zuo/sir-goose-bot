import { CommandInteraction, GuildMember, Message, Permissions } from 'discord.js';
import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import { GuildConfigCache } from '#util/guildConfigCache';
import { sendVerificationReplies } from '#util/verification';

export class Verify extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'verify',
            description: 'Verify your UW identity to receive roles',
            category: 'Verification',
            cooldownSeconds: 600,
            cooldownMaxUses: 5,
        });
    }

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        const config = await GuildConfigCache.fetchConfig(interaction.guild?.id);

        if (interaction.guild && config.enableVerification === false) {
            const member = interaction.member as GuildMember | null;

            if (member && member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
                await this.sendErrorEmbed(
                    interaction,
                    'Verification Not Enabled',
                    `This server does not have verification enabled.

                    Looking to enable verification? [Read the guide.](https://sir-goose.notion.site/sir-goose/Setting-Up-Verification-0f309b2a00fc4e198b5f2182d2452fcd)`
                );
            } else {
                await this.sendErrorEmbed(interaction, 'Verification Not Enabled', 'This server does not have verification enabled.');
            }

            return;
        }

        const discordUser = this.getUser(interaction);

        await sendVerificationReplies(this.client, interaction, discordUser, false, true);
    }
}
