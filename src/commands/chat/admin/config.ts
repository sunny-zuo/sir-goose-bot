import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
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
            isTextCommand: true,
            guildOnly: true,
            userPermissions: [PermissionsBitField.Flags.ManageGuild],
        });
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await OverviewView.initialRender(interaction);
    }
}
