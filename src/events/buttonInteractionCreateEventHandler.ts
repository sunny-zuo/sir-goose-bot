import { Collection, Interaction, MessageEmbed } from 'discord.js';
import { EventHandler } from './eventHandler';
import ButtonInteractionHandlers from '../interactions/button';
import { ButtonInteractionHandler } from '../interactions/button/buttonInteractionHandler';
import Client from '../Client';

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

        this.client.log.info(
            `BUTTON ${interaction.user.tag} (${interaction.user.id}) pressed button with custom id ${interaction.customId} in ${
                interaction.guild?.name ?? 'DMs'
            } (${interaction.guild?.id ?? 'none'})`
        );

        const [interactioName, args] = interaction.customId.split('|');

        const handler = this.buttonInteractionHandlers.get(interactioName);

        if (handler) {
            const userLimit = handler.cooldown.checkLimit(interaction.user.id);
            if (!userLimit.blocked) {
                handler.execute(interaction, args);
            } else {
                const embed = new MessageEmbed()
                    .setTitle('Rate Limited')
                    .setColor('RED')
                    .setDescription(
                        handler.limitMessage ??
                            `You can only interact with this button type ${handler.cooldown.maxUses} time(s) every ${handler.cooldown.seconds} seconds. Please try again in ${userLimit.secondsUntilReset} seconds.`
                    )
                    .setTimestamp();

                interaction.reply({ embeds: [embed], ephemeral: true });

                this.client.log.info(
                    `${interaction.user.tag} tried to use interact with button ${handler.customId} in ${
                        interaction.guild?.name ?? 'DMs'
                    } (${interaction.guild?.id ?? 'none'}) but was rate limited.`
                );
            }
        }
    }
}
