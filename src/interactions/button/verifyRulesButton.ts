import { ButtonInteraction, MessageActionRow, Modal, ModalActionRowComponent, TextInputComponent } from 'discord.js';
import { ButtonInteractionHandler } from './buttonInteractionHandler';
import { Cooldown } from '#util/cooldown';
import Client from '#src/Client';

export class VerifyRulesButton implements ButtonInteractionHandler {
    readonly client: Client;
    readonly customId = 'verifyRules';
    readonly cooldown: Cooldown;

    constructor(client: Client) {
        this.client = client;
        this.cooldown = new Cooldown(60, 3);
    }

    async execute(interaction: ButtonInteraction): Promise<void> {
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
