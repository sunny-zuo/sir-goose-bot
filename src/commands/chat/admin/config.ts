import { CommandInteraction, Permissions } from 'discord.js';
import Client from '#src/Client';
import { ChatCommand } from '../ChatCommand';
import { OverviewView } from './configViews/overviewView';

export class Config extends ChatCommand {
    constructor(client: Client) {
        super(client, {
            name: 'config',
            description: "View and edit the server's bot configuration.",
            category: 'Admin',
            isSlashCommand: true,
            isTextCommand: false,
            guildOnly: true,
            userPermissions: [Permissions.FLAGS.MANAGE_GUILD],
        });
    }

    async execute(interaction: CommandInteraction): Promise<void> {
        await OverviewView.initialRender(this.client, interaction);
    }
}
