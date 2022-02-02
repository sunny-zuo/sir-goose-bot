import { EventHandler } from './eventHandler';
import Client from '#src/Client';
import { Role } from 'discord.js';
import { Modlog } from '#util/modlog';
import { GuildConfigCache } from '#util/guildConfigCache';

export class RoleDeleteEventHandler implements EventHandler {
    readonly eventName = 'roleDelete';
    readonly client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    async execute(deletedRole: Role): Promise<void> {
        this.checkVerificationRules(deletedRole);
    }

    async checkVerificationRules(deletedRole: Role): Promise<void> {
        const guild = deletedRole.guild;
        const config = await GuildConfigCache.fetchConfig(guild.id);

        if (config.enableVerification && config.verificationRules?.rules && config.verificationRules.rules.length > 0) {
            const verificationRules = config.verificationRules.rules;

            for (const rule of verificationRules) {
                for (const role of rule.roles) {
                    if (role.id === deletedRole.id) {
                        Modlog.logInfoMessage(
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
}
