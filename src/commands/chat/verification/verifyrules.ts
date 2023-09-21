import { CommandInteraction, Message, MessageActionRow, MessageButton, MessageEmbed, Permissions } from 'discord.js';
import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';
import { GuildConfigCache } from '#util/guildConfigCache';
import { codeBlock, inlineCode } from '@discordjs/builders';
import { serializeVerificationRules } from '#util/verification';

export class VerifyRules extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'verifyrules',
            description: 'Set or see verification rules. Create a ruleset here: https://sebot.sunnyzuo.com/',
            category: 'Verification',
            guildOnly: true,
            clientPermissions: [Permissions.FLAGS.MANAGE_ROLES],
            userPermissions: [Permissions.FLAGS.MANAGE_GUILD],
        });
    }

    async execute(interaction: Message | CommandInteraction): Promise<void> {
        const config = await GuildConfigCache.fetchConfig(interaction.guild!.id);

        const button = new MessageActionRow().addComponents(
            new MessageButton().setCustomId(`verifyRules`).setLabel('Update Rules').setStyle('PRIMARY')
        );

        const embed = new MessageEmbed().setColor('BLUE').setTitle('Verification Rules').setDescription(`Verification is ${
            config.enableVerification ? 'enabled ' : `disabled. Enable it using ${inlineCode('/config')}`
        }. [Create a ruleset.](https://sebot.sunnyzuo.com/)
                ${codeBlock(serializeVerificationRules(config.verificationRules))}`);

        await interaction.reply({ embeds: [embed], components: [button] });
    }
}
