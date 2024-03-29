import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { ButtonInteractionHandler } from './buttonInteractionHandler';
import { Cooldown } from '#util/cooldown';
import Client from '#src/Client';

export class VerificationLearnMore implements ButtonInteractionHandler {
    readonly client: Client;
    readonly customId = 'verificationLearnMore';
    readonly cooldown: Cooldown;

    constructor(client: Client) {
        this.client = client;
        this.cooldown = new Cooldown(60, 3);
    }

    async execute(interaction: ButtonInteraction): Promise<void> {
        const embed = new EmbedBuilder().setTitle('Verification FAQ').setColor('Blue').setTimestamp();

        embed.addFields([
            {
                name: 'What is verification?',
                value: "Verification is feature used by servers to confirm that users are UWaterloo students, for enhanced safety and privacy. Upon successful verification, you'll be automatically assigned roles configured by the server admins.",
            },
            {
                name: 'How do I verify?',
                value: `You can verify by pressing the verify button, and logging in with your UWaterloo account. You'll need to grant the bot permission to read your UW Office 365 profile, which includes your name, email, faculty and year.

                Once you've verified with Sir Goose, you'll be automatically verified on all servers using Sir Goose for verification!`,
            },
            {
                name: 'Does Sir Goose get access to my password?',
                value: 'No. Authentication uses [OAuth 2.0](https://oauth.net/2/), an industry standard protocol for authorization. Logging in will authorize the bot to read your profile info, without sharing your password with the bot.',
            },
            {
                name: 'What is my data used for?',
                value: 'Your data will be used to assign roles configured by server admins, and may be used to assist in misconduct investigations when there is clear evidence of wrongdoing. Your data may also be used to prevent ban circumvention.',
            },
            {
                name: 'Who has access to my data?',
                value: `${process.env.OWNER_DISCORD_USERNAME} (bot developer) is the only person with access to your data. Server owners do not have access, and your data will not be used for any purposes other than what is described without your consent.`,
            },
            {
                name: "What if I'm not a UWaterloo student?",
                value: 'Unfortunately, non-UW students will be unable to verify with Sir Goose. If verification is required on a server you joined, message a server admin about alternate verification methods.',
            },
        ]);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}
