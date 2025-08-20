import {
    ChatInputCommandInteraction,
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
            isTextCommand: false,
            clientPermissions: [PermissionsBitField.Flags.ManageRoles],
            userPermissions: [PermissionsBitField.Flags.ManageGuild, PermissionsBitField.Flags.ManageRoles],
        });
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();

        const config = await GuildConfigCache.fetchConfig(interaction.guild!.id);

        const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(`verifyRules`).setLabel('Update Rules').setStyle(ButtonStyle.Primary)
        );
        const embed = new EmbedBuilder().setColor('Blue').setTitle('Verification Rules').setDescription(`Verification is ${
            config.enableVerification ? 'enabled' : `disabled. Enable it using ${inlineCode('/config')}`
        }. [Click here to create or modify a ruleset.](https://sebot.sunnyzuo.com/)
                ${codeBlock(serializeVerificationRules(config.verificationRules))}`);

        await interaction.editReply({ embeds: [embed], components: [button] });
    }
}
