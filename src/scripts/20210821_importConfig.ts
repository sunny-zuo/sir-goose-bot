import path from 'path';
import fs from 'fs';
import GuildConfigModel from '../models/guildConfig.model';

export async function importConfig(): Promise<void> {
    const importLocation = path.join(process.cwd(), 'src', 'data', 'scripts', '20210821_configs.json');
    const importedConfigs = JSON.parse(fs.readFileSync(importLocation, 'utf8'));

    for (const importedConfig of importedConfigs) {
        const config = {
            guildId: importedConfig.serverID,
            prefix: importedConfig.prefix,
            enableModlog: false,
            enableVerification: importedConfig.verificationEnabled,
            enablePins: importedConfig.enablePins,
            verificationRules: {
                baseYear: importedConfig.verificationRules.baseYear,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                rules: importedConfig.verificationRules?.rules.map((rule: any) => ({
                    roles: rule.roles,
                    department: rule.department,
                    matchType: rule.match,
                    yearMatch: rule.year,
                })),
            },
        };

        await GuildConfigModel.create(config);
    }
}
