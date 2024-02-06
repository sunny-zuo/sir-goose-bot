import {
    ChatInputCommandInteraction,
    Message,
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    codeBlock,
    inlineCode,
    PermissionsBitField,
    ButtonStyle,
} from 'discord.js';
import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import { GuildConfigCache } from '#util/guildConfigCache';
import { serializeVerificationRules } from '#util/verification';

export class VerifyRules extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'verifyrules',
            description: 'Set or see verification rules. Create a ruleset here: https://sebot.sunnyzuo.com/',
            category: 'Verification',
            guildOnly: true,
            clientPermissions: [PermissionsBitField.Flags.ManageRoles],
            userPermissions: [PermissionsBitField.Flags.ManageGuild],
        });
    }

    async execute(interaction: Message | ChatInputCommandInteraction): Promise<void> {
        const config = await GuildConfigCache.fetchConfig(interaction.guild!.id);

        const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(`verifyRules`).setLabel('Update Rules').setStyle(ButtonStyle.Primary)
        );

        const embed = new EmbedBuilder().setColor('Blue').setTitle('Verification Rules').setDescription(`Verification is ${
            config.enableVerification ? 'enabled ' : `disabled. Enable it using ${inlineCode('/config')}`
        }. [Create a ruleset.](https://sebot.sunnyzuo.com/)
                ${codeBlock(serializeVerificationRules(config.verificationRules))}`);

        await interaction.reply({ embeds: [embed], components: [button] });
    }
}
