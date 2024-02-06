import { ActionRow, ActionRowBuilder, ButtonBuilder, ComponentType, MessageActionRowComponent } from 'discord.js';

function convertButtonActionRowToBuilder(row: ActionRow<MessageActionRowComponent>): ActionRowBuilder<ButtonBuilder> {
    const buttonBuilders = [];

    for (const component of row.components) {
        if (component.type === ComponentType.Button) {
            buttonBuilders.push(ButtonBuilder.from(component));
        } else {
            throw new Error('Attempted to convert a non-button action row to a button action row builder');
        }
    }

    return new ActionRowBuilder<ButtonBuilder>().addComponents(buttonBuilders);
}

export { convertButtonActionRowToBuilder };
