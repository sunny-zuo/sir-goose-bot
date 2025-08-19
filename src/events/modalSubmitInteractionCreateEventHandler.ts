import { Collection, EmbedBuilder, inlineCode, Interaction } from 'discord.js';
import { EventHandler } from './eventHandler';
import Client from '#src/Client';
import { logger } from '#util/logger';
import ModalSubmitInteractionHandlers from '../interactions/modal';
import { ModalSubmitInteractionHandler } from '../interactions/modal/modalInteractionHandler';

export class ModalSubmitInteractionCreateEventHandler implements EventHandler {
    readonly eventName = 'interactionCreate';
    readonly client: Client;
    readonly modalSubmitInteractionHandlers = new Collection<string, ModalSubmitInteractionHandler>();

    constructor(client: Client) {
        this.client = client;

        for (const InteractionHandler of ModalSubmitInteractionHandlers) {
            const interactionHandler = new InteractionHandler(client);
            this.modalSubmitInteractionHandlers.set(interactionHandler.customId, interactionHandler);
        }
    }

    async execute(interaction: Interaction): Promise<void> {
        if (!interaction.isModalSubmit()) return;

        logger.info(
            {
                modal: { customId: interaction.customId },
                guild: { id: interaction.guild?.id ?? 'none' },
                user: { id: interaction.user.id },
            },
            `Processing modal submission ${interaction.customId}`
        );

        const [interactionName] = interaction.customId.split('|');
        const handler = this.modalSubmitInteractionHandlers.get(interactionName);

        if (handler) {
            try {
                if (handler.userPermissions.length > 0 && !interaction.memberPermissions?.has(handler.userPermissions)) {
                    const missingPerms = interaction.memberPermissions?.missing(handler.userPermissions);

                    // the only scenario we expect memberPermissions to be undefined is if this occurs outside of a guild
                    // any modal interaction handler that has permissions set is implicitly guild only
                    if (missingPerms == undefined) {
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('Red').setDescription(`This modal can only be used in guilds.`)],
                            ephemeral: true,
                        });
                        logger.warn(
                            {
                                modal: { customId: interaction.customId },
                                guild: { id: interaction.guild?.id ?? 'none' },
                                user: { id: interaction.user.id },
                            },
                            `guildonly modal somehow submitted outside of a guild? or somehow memberPermissions doesn't exist`
                        );
                        return;
                    } else {
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('Red')
                                    .setDescription(
                                        `You must have the following permissions to use this modal:\n${missingPerms
                                            .map((p) => inlineCode(p))
                                            .join(', ')}`
                                    ),
                            ],
                            ephemeral: true,
                        });
                        return;
                    }
                }

                await handler.execute(interaction);
            } catch (e) {
                logger.error(e, e.message);
            }
        }
    }
}
