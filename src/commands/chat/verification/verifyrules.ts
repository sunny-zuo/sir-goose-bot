import { CommandInteraction, Permissions, Modal, TextInputComponent, MessageActionRow, ModalActionRowComponent } from 'discord.js';
import { ChatCommand } from '../ChatCommand';
import Client from '#src/Client';

export class VerifyRules extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'verifyrules',
            description: 'Set or see verification rules. Create a ruleset here: https://sebot.sunnyzuo.com/',
            category: 'Verification',
            guildOnly: true,
            clientPermissions: [Permissions.FLAGS.MANAGE_ROLES],
            userPermissions: [Permissions.FLAGS.MANAGE_GUILD],
            isSlashCommand: true,
            isTextCommand: false,
        });
    }

    async execute(
        interaction: CommandInteraction
        // args?: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>
    ): Promise<void> {
        //  const ruleString = args?.getString('rules');

        const modal = new Modal().setCustomId('verifyRulesModal').setTitle('Verification Rules');

        const ruleStringInput = new TextInputComponent()
            .setCustomId('ruleStringInput')
            .setLabel('Paste ruleset here:')
            .setStyle('PARAGRAPH')
            .setRequired(true);

        const actionRow = new MessageActionRow<ModalActionRowComponent>().addComponents(ruleStringInput);

        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    }
}
