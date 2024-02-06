import { EventHandler } from './eventHandler';
import Client from '#src/Client';
import { ActionRowBuilder, ButtonBuilder, ChannelType, ComponentType, Role } from 'discord.js';
import { Modlog } from '#util/modlog';
import { GuildConfigCache } from '#util/guildConfigCache';
import { logger } from '#util/logger';
import ButtonRoleModel from '#models/buttonRole.model';
import { convertButtonActionRowToBuilder } from '#util/messageComponents';

export class RoleDeleteEventHandler implements EventHandler {
    readonly eventName = 'roleDelete';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(deletedRole: Role): Promise<void> {
        await this.checkVerificationRules(deletedRole);
        await this.updateButtonRolePrompts(deletedRole);
    }

    async checkVerificationRules(deletedRole: Role): Promise<void> {
        const guild = deletedRole.guild;
        const config = await GuildConfigCache.fetchConfig(guild.id);

        if (config.enableVerification && config.verificationRules?.rules && config.verificationRules.rules.length > 0) {
            const verificationRules = config.verificationRules.rules;

            for (const rule of verificationRules) {
                for (const role of rule.roles) {
                    if (role.id === deletedRole.id) {
                        logger.info(
                            {
                                event: { name: this.eventName },
                                role: { id: deletedRole.id, name: deletedRole.name },
                                guild: { id: guild.id },
                            },
                            'A role used for verification was deleted.'
                        );

                        await Modlog.logInfoMessage(
                            this.client,
                            guild,
                            'Verification Role Deleted',
                            `The role \`${deletedRole.name}\` was setup to be one of the roles assigned in the server's verification rules, but is now deleted. Please update the verification rules!`,
                            'Red'
                        );
                        return;
                    }
                }
            }
        }
    }

    async updateButtonRolePrompts(deletedRole: Role): Promise<void> {
        const guild = deletedRole.guild;

        const prompts = await ButtonRoleModel.find({ guildId: guild.id, 'roles.id': deletedRole.id });
        if (!prompts || !prompts.length) return;

        for (const prompt of prompts) {
            prompt.roles = prompt.roles.filter((r) => r.id !== deletedRole.id);
            await prompt.save();

            const promptChannel = await guild.channels.fetch(prompt.channelId).catch(() => null);
            if (!promptChannel || promptChannel.type !== ChannelType.GuildText) continue;

            const promptMessage = await promptChannel.messages.fetch(prompt.messageId);
            if (!promptMessage) continue;

            const rowIndex = promptMessage.components.findIndex((row) =>
                row.components.some((component) => component.type === ComponentType.Button && component.customId?.includes(deletedRole.id))
            );
            if (rowIndex === -1) continue;

            const colIndex = promptMessage.components[rowIndex].components.findIndex(
                (component) => component.type === ComponentType.Button && component.customId?.includes(deletedRole.id)
            );
            if (colIndex === -1) continue;

            const newComponents: ActionRowBuilder<ButtonBuilder>[] = promptMessage.components.map(convertButtonActionRowToBuilder);
            newComponents[rowIndex].components.splice(colIndex, 1);

            const cleanComponents = newComponents.filter((component) => component.components.length !== 0);
            await promptMessage.edit({ components: cleanComponents });
        }
    }
}
