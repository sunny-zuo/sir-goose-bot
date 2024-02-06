import { Collection, Interaction, EmbedBuilder } from 'discord.js';
import { EventHandler } from './eventHandler';
import ButtonInteractionHandlers from '../interactions/button';
import { ButtonInteractionHandler } from '../interactions/button/buttonInteractionHandler';
import Client from '#src/Client';
import { logger } from '#util/logger';

export class ButtonInteractionCreateEventHandler implements EventHandler {
    readonly eventName = 'interactionCreate';
    readonly client: Client;
    readonly buttonInteractionHandlers = new Collection<string, ButtonInteractionHandler>();

    constructor(client: Client) {
        this.client = client;

        for (const InteractionHandler of ButtonInteractionHandlers) {
            const interactionHandler = new InteractionHandler(client);
            this.buttonInteractionHandlers.set(interactionHandler.customId, interactionHandler);
        }
    }

    async execute(interaction: Interaction): Promise<void> {
        if (!interaction.isButton()) return;

        logger.info(
            {
                button: { customId: interaction.customId },
                guild: { id: interaction.guild?.id ?? 'none' },
                user: { id: interaction.user.id },
            },
            `Processing button interaction ${interaction.customId}`
        );

        const [interactionName, args] = interaction.customId.split('|');

        const handler = this.buttonInteractionHandlers.get(interactionName);

        if (handler) {
            const userLimit = handler.cooldown.checkLimit(interaction.user.id);
            if (!userLimit.blocked) {
                handler.execute(interaction, args).catch((e) => {
                    logger.error(e, e.message);
                });
            } else {
                const embed = new EmbedBuilder()
                    .setTitle('Rate Limited')
                    .setColor('Red')
                    .setDescription(
                        handler.limitMessage ??
                            `You can only interact with this button type ${handler.cooldown.maxUses} time(s) every ${handler.cooldown.seconds} seconds. Please try again in ${userLimit.secondsUntilReset} seconds.`
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });

                logger.info(
                    {
                        ratelimit: { type: 'button', name: handler.customId },
                        guild: { id: interaction.guild?.id ?? 'none' },
                        user: { id: interaction.user.id },
                    },
                    'User was ratelimited on a button interaction'
                );
            }
        }
    }
}
