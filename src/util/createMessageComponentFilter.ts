import { MessageComponentInteraction, MessageEmbed, Snowflake } from 'discord.js';
import { logger } from './logger';

export function createMessageComponentFilter(userId: Snowflake): (i: MessageComponentInteraction) => boolean {
    const filter = (i: MessageComponentInteraction) => {
        if (i.user.id === userId) return true;
        i.reply({
            embeds: [
                new MessageEmbed()
                    .setDescription(`This ${i.componentType === 'BUTTON' ? 'button' : 'dropdown'} isn't for you!`)
                    .setColor('RED'),
            ],
            ephemeral: true,
        }).catch((e) => logger.error(e, e.message));
        return false;
    };

    return filter;
}
