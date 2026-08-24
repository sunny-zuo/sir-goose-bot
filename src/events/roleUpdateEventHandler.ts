import { EventHandler } from './eventHandler';
import Client from '#src/Client';
import { ComponentType, ActionRowBuilder, ButtonBuilder, Role, ButtonStyle, inlineCode } from 'discord.js';
import { Modlog } from '#util/modlog';
import GuildConfigModel from '#models/guildConfig.model';
import ButtonRoleModel from '#models/buttonRole.model';
import { logger } from '#util/logger';
import { convertButtonActionRowToBuilder } from '#util/messageComponents';
import { RoleCreateEventHandler } from './roleCreateEventHandler';

export class RoleUpdateEventHandler implements EventHandler {
    readonly eventName = 'roleUpdate';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(oldRole: Role, newRole: Role): Promise<void> {
        await this.updateVerificationRules(oldRole, newRole);
        await this.checkPseudoNewRoleCreation(oldRole, newRole);
        await this.updateButtonRolePrompts(oldRole, newRole);
    }

    async updateVerificationRules(oldRole: Role, newRole: Role): Promise<void> {
        // skip verification rule update checks if the role is newly created or if no name changes occurred
        if (oldRole.name === newRole.name || oldRole.name === 'new role' || newRole.name === 'new role') {
            return;
        }

        const guild = newRole.guild;
        const config = await GuildConfigModel.findOne({ guildId: guild.id });
        if (!config || !config.enableVerification) return;

        let didRulesUpdate = false;
        for (const rule of config.verificationRules?.rules ?? []) {
            for (const role of rule.roles) {
                if (role.id === oldRole.id) {
                    role.name = newRole.name;
                    didRulesUpdate = true;
                }
            }
        }
        for (const role of config.verificationRules?.unverified?.roles ?? []) {
            if (role.id === oldRole.id) {
                role.name = newRole.name;
                didRulesUpdate = true;
            }
        }

        if (didRulesUpdate) {
            logger.info(
                {
                    event: { name: this.eventName },
                    role: { id: newRole.id, oldName: oldRole.name, newName: newRole.name },
                    guild: { id: guild.id },
                },
                'Automatically updating renamed role in verification rules'
            );

            await config.save();
            await Modlog.logInfoMessage(
                guild,
                'Verification Role Updated',
                `The role ${inlineCode(oldRole.name)} is used for verification, and was renamed to ${inlineCode(
                    newRole.name
                )}. The server's verification rules have automatically updated to reflect this change.`,
                'Green'
            );
        }
    }

    async checkPseudoNewRoleCreation(oldRole: Role, newRole: Role): Promise<void> {
        // this check is in place so that this function will only be called for pseudo role creation events
        // when you create a new role, sometimes the result will be a new role named 'new role' that you later modify
        if (oldRole.name !== 'new role' || newRole.name === 'new role') return;

        // process this as if it was a new role
        await RoleCreateEventHandler.checkNewRoleRuleUpdate(this.eventName, newRole);
    }

    async updateButtonRolePrompts(oldRole: Role, newRole: Role): Promise<void> {
        if (oldRole.name === newRole.name) return;
        const guild = newRole.guild;

        const prompts = await ButtonRoleModel.find({ guildId: guild.id, 'roles.id': oldRole.id });
        if (!prompts || !prompts.length) return;

        for (const prompt of prompts) {
            logger.info(
                {
                    event: { name: this.eventName },
                    role: { id: newRole.id, oldName: oldRole.name, newName: newRole.name },
                    guild: { id: guild.id },
                    document: { id: prompt._id },
                },
                'Updating renamed role in button role prompt'
            );

            prompt.roles.find((r) => r.name === oldRole.name)!.name = newRole.name;
            await prompt.save();

            const promptChannel = await guild.channels.fetch(prompt.channelId).catch(() => null);
            if (!promptChannel || !promptChannel.isTextBased()) continue;

            const promptMessage = await promptChannel.messages.fetch(prompt.messageId);
            if (!promptMessage) continue;

            const rowIndex = promptMessage.components.findIndex((row) =>
                row.components.some((component) => component.type === ComponentType.Button && component.customId?.includes(oldRole.id))
            );
            if (rowIndex === -1) continue;

            const colIndex = promptMessage.components[rowIndex].components.findIndex(
                (component) => component.type === ComponentType.Button && component.customId?.includes(oldRole.id)
            );
            if (colIndex === -1) continue;

            const newComponents: ActionRowBuilder<ButtonBuilder>[] = promptMessage.components.map(convertButtonActionRowToBuilder);
            newComponents[rowIndex].components.splice(
                colIndex,
                1,
                new ButtonBuilder()
                    .setLabel(newRole.name)
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId(`buttonRole|{"roleId":"${newRole.id}","_id":"${prompt._id}"}`)
            );

            await promptMessage.edit({ components: newComponents });
        }
    }
}
