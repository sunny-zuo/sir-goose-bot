import {
    ChatInputCommandInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ButtonStyle,
    inlineCode,
    Guild,
    ButtonInteraction,
    StringSelectMenuInteraction,
} from 'discord.js';
import VerificationOverrideModel, { VerificationOverride, OverrideScope } from '#models/verificationOverride.model';
import { logger } from '#util/logger';
import { catchUnknownMessage } from '#util/message';
import { handleViewOverride } from './verifyOverrideView';

const ITEMS_PER_PAGE = 5;

export async function handleListOverrides(interaction: ChatInputCommandInteraction, guild: Guild): Promise<void> {
    try {
        if (!interaction.deferred) {
            await interaction.deferReply();
        }

        const overrides = await VerificationOverrideModel.find({
            guildId: guild.id,
            scope: OverrideScope.GUILD,
            deleted: { $exists: false },
        }).sort({ createdAt: -1 });

        if (overrides.length === 0) {
            const embed = new EmbedBuilder().setColor('Yellow').setTitle('No Verification Overrides Found')
                .setDescription(`This server has no active verification overrides. Verification overrides are a feature that allows you to manually set the department and/or entrance year of user(s) for verification purposes. This can be used to fix data inaccuracies or to manually verify a user in this server.

                Use ${inlineCode('/verifyoverride create')} to create your first override.`);

            await interaction.editReply({ embeds: [embed] });
            return;
        }

        await renderListPage(interaction, guild, overrides, 0);
    } catch (error) {
        logger.error(error, 'Error in handleListOverrides');

        await interaction
            .editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('An error occurred while listing verification overrides. Please try again later.'),
                ],
            })
            .catch(catchUnknownMessage);
    }
}

async function renderListPage(
    interaction: ChatInputCommandInteraction,
    guild: Guild,
    allOverrides: VerificationOverride[],
    currentPage: number
): Promise<void> {
    const { embed, components } = createListPageContent(allOverrides, currentPage);
    const message = await interaction.editReply({ embeds: [embed], components });

    // Set up component collector only once
    const collector = message.createMessageComponentCollector({
        time: 1000 * 60 * 10, // 10 minutes
        filter: (i) => i.user.id === interaction.user.id,
    });

    collector.on('collect', async (i) => {
        try {
            if (i.isButton()) {
                currentPage = await handlePaginationButton(i, allOverrides, currentPage, Math.ceil(allOverrides.length / ITEMS_PER_PAGE));
            } else if (i.isStringSelectMenu() && i.customId === 'verifyoverrideListSelect') {
                await handleUserSelection(i, guild);
            }
        } catch (error) {
            logger.error(error, 'Error handling list interaction');
            await i
                .reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription('An error occurred while processing your request. Please try again.'),
                    ],
                    ephemeral: true,
                })
                .catch(catchUnknownMessage);
        }
    });

    collector.on('end', async () => {
        await interaction.editReply({ components: [] }).catch(catchUnknownMessage);
    });
}

function createListPageContent(
    allOverrides: VerificationOverride[],
    currentPage: number
): { embed: EmbedBuilder; components: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] } {
    const totalPages = Math.ceil(allOverrides.length / ITEMS_PER_PAGE);
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, allOverrides.length);
    const pageOverrides = allOverrides.slice(startIndex, endIndex);

    // Create embed with override list
    const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle(`Verification Overrides (${allOverrides.length} total)`)
        .setFooter({ text: `Page ${currentPage + 1} of ${totalPages}` });

    let description = '';
    for (let i = 0; i < pageOverrides.length; i++) {
        const override = pageOverrides[i];
        const itemNumber = startIndex + i + 1;

        const department = override.department || '<not overriden>';
        const year = override.o365CreatedDate ? override.o365CreatedDate.getFullYear().toString() : '<not overriden>';

        description += `**${itemNumber}.** <@${override.discordId}> (Discord ID: ${override.discordId})\n`;
        description += `> Department: ${inlineCode(department)} | Year: ${inlineCode(year)}\n`;
        description += `> Created: <t:${Math.floor(override.createdAt.getTime() / 1000)}:R> by <@${override.createdBy}>\n\n`;
    }

    embed.setDescription(description);

    const components: ActionRowBuilder<StringSelectMenuBuilder | ButtonBuilder>[] = [];

    if (pageOverrides.length > 0) {
        const emojis = ['🟪', '🟦', '🟨', '🟧', '🟩'] as const;

        const selectOptions = pageOverrides.map((override, index) => {
            const itemNumber = startIndex + index + 1;
            const department = override.department || '<not overriden>';
            const year = override.o365CreatedDate ? override.o365CreatedDate.getFullYear().toString() : '<not overriden>';

            return new StringSelectMenuOptionBuilder()
                .setLabel(`${itemNumber}. User ${override.discordId}`)
                .setValue(override.discordId)
                .setDescription(`${department} | ${year}`)
                .setEmoji(emojis[index % emojis.length]);
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('verifyoverrideListSelect')
            .setPlaceholder('Select a user to view their override details')
            .addOptions(selectOptions);

        components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu));
    }

    if (totalPages > 1) {
        const prevButton = new ButtonBuilder().setCustomId('verifyoverrideListPrev').setLabel('Previous').setStyle(ButtonStyle.Secondary);

        const nextButton = new ButtonBuilder().setCustomId('verifyoverrideListNext').setLabel('Next').setStyle(ButtonStyle.Secondary);

        components.push(new ActionRowBuilder<ButtonBuilder>().addComponents([prevButton, nextButton]));
    }

    return { embed, components };
}

async function updateListPage(interaction: ButtonInteraction, allOverrides: VerificationOverride[], newPage: number): Promise<void> {
    const { embed, components } = createListPageContent(allOverrides, newPage);
    await interaction.editReply({ embeds: [embed], components });
}

async function handlePaginationButton(
    interaction: ButtonInteraction,
    allOverrides: VerificationOverride[],
    currentPage: number,
    totalPages: number
): Promise<number> {
    await interaction.deferUpdate();

    // wrap pages around if the first or last pages are reached
    const pageCalculators = {
        verifyoverrideListPrev: () => (currentPage === 0 ? totalPages - 1 : currentPage - 1),
        verifyoverrideListNext: () => (currentPage === totalPages - 1 ? 0 : currentPage + 1),
    } as const;

    const newPage = pageCalculators[interaction.customId as keyof typeof pageCalculators]?.() ?? currentPage;

    // just update the message content, don't create a new collector
    await updateListPage(interaction, allOverrides, newPage);
    return newPage; // return newPage so that the collector can keep track
}

async function handleUserSelection(interaction: StringSelectMenuInteraction, guild: Guild): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    const selectedUserId = interaction.values[0];

    if (!selectedUserId) {
        await interaction.editReply({
            embeds: [new EmbedBuilder().setColor('Red').setDescription('No user was selected. Please try again.')],
        });
        return;
    }

    try {
        const targetUser = await interaction.client.users.fetch(selectedUserId);
        await handleViewOverride(interaction, targetUser, guild);
    } catch (error) {
        logger.error(error, 'Error fetching user for override view');
        await interaction
            .editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('Could not fetch user information. The user may no longer exist or be accessible.'),
                ],
            })
            .catch(catchUnknownMessage);
    }
}
