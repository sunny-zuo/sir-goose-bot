import {
    ButtonInteraction,
    ActionRowBuilder,
    EmbedBuilder,
    ModalBuilder,
    PermissionsBitField,
    TextInputBuilder,
    TextInputStyle,
    ModalActionRowComponentBuilder,
} from 'discord.js';
import { ButtonInteractionHandler } from './buttonInteractionHandler';
import { Cooldown } from '#util/cooldown';
import Client from '#src/Client';

export class VerifyRulesButton implements ButtonInteractionHandler {
    readonly client: Client;
    readonly customId = 'verifyRules';
    readonly cooldown: Cooldown;

    constructor(client: Client) {
        this.client = client;
        this.cooldown = new Cooldown(5, 3);
    }

    async execute(interaction: ButtonInteraction): Promise<void> {
        if (!interaction.inCachedGuild()) return;
        const member = interaction.member;

        // TODO: refactor into more generic permission checker
        if (!member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription('You must have the Manage Guild permission to use this button.').setColor('Red'),
                ],
            });
            return;
        }

        const modal = new ModalBuilder().setCustomId('verifyRulesModal').setTitle('Verification Rules');

        const ruleStringInput = new TextInputBuilder()
            .setCustomId('ruleStringInput')
            .setLabel('Paste ruleset here:')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(ruleStringInput);

        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    }
}
