import { EventHandler } from './eventHandler';
import Client from '#src/Client';
import { Role } from 'discord.js';
import { Modlog } from '#util/modlog';
import { GuildConfigCache } from '#util/guildConfigCache';
import ButtonRoleModel from '../models/buttonRole.model';

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
                        await Modlog.logInfoMessage(
                            this.client,
                            guild,
                            'Verification Role Deleted',
                            `The role \`${deletedRole.name}\` was setup to be one of the roles assigned in the server's verification rules, but is now deleted. Please update the verification rules!`,
                            'RED'
                        );

                        this.client.log.info(
                            `A role named ${deletedRole.name} that was used for verification was deleted in ${guild.name} (${guild.id}).`
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

            const promptChannel = await guild.channels.fetch(prompt.channelId);
            if (!promptChannel || !promptChannel.isText()) continue;

            const promptMessage = await promptChannel.messages.fetch(prompt.messageId);
            if (!promptMessage) continue;

            const components = promptMessage.components;

            const row = components.find((row) =>
                row.components.some((component) => component.type === 'BUTTON' && component.customId?.includes(deletedRole.id))
            );
            if (!row) continue;

            const updateIndex = row.components.findIndex(
                (component) => component.type === 'BUTTON' && component.customId?.includes(deletedRole.id)
            );
            if (updateIndex === -1) continue;

            row.spliceComponents(updateIndex, 1);
            const cleanComponents = components.filter((component) => component.components.length !== 0);
            await promptMessage.edit({ components: cleanComponents });
        }
    }
}
