import GuildConfigModel from '#models/guildConfig.model';

export async function migrateRules(): Promise<void> {
    for await (const guildConfig of GuildConfigModel.find()) {
        if (!guildConfig.verificationRules || guildConfig.verificationRules.rules.length === 0) continue;

        const baseYear = guildConfig.verificationRules.baseYear;

        for (const rule of guildConfig.verificationRules.rules) {
            if (rule.yearMatch !== 'all' && !rule.year) {
                rule.year = baseYear;
            }
        }

        await guildConfig.save();
    }
}
