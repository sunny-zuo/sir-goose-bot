import {
    ButtonInteraction,
    GuildMember,
    MessageActionRow,
    MessageEmbed,
    Modal,
    ModalActionRowComponent,
    Permissions,
    TextInputComponent,
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
        // TODO: refactor into more generic permission checker
        const member = interaction.member as GuildMember;
        if (!member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
            await interaction.reply({
                embeds: [
                    new MessageEmbed().setDescription('You must have the Manage Guild permission to use this button.').setColor('RED'),
                ],
            });
            return;
        }

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
