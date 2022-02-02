import { ButtonInteraction, MessageEmbed } from 'discord.js';
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
        const embed = new MessageEmbed().setTitle('Verification FAQ').setColor('BLUE').setTimestamp();
        embed.addField(
            'What is verification?',
            "Verification is feature used by servers to confirm that users are UWaterloo students, for enhanced safety and privacy. Upon successful verification, you'll be automatically assigned roles configured by the server admins."
        );
        embed.addField(
            'How do I verify?',
            `You can verify by pressing the verify button, and logging in with your UWaterloo account. You'll need to grant the bot permission to read your UW Office 365 profile, which includes your name, email, faculty and year.
            
            Once you've verified with Sir Goose, you'll be automatically verified on all servers using Sir Goose for verification!`
        );
        embed.addField(
            'What is my data used for?',
            'Your data will be used to assign roles configured by server admins, and may be used to assist in misconduct investigations when there is clear evidence of wrongdoing. Your data may also be used to prevent ban circumvention.'
        );
        embed.addField(
            'Who has access to my data?',
            `${process.env.OWNER_DISCORD_USERNAME} (bot developer) is the only person with access to your data. Server owners do not have access, and your data will not be used for any purposes other than what is described without your consent.`
        );
        embed.addField(
            "What if I'm not a UWaterloo student?",
            'Unfortunately, non-UW students will be unable to verify with Sir Goose. If verification is required on a server you joined, message a server admin about alternate verification methods.'
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}
