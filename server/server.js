const express = require('express');
const app = express();
const mongo = require('../mongo.js');
const settings = require('../settings');

let client;

function init(discordClient) {
    client = discordClient;
}

app.use(express.json());

// A forwarding mechanism is used as we only have a single oauth endpoint.
// See https://github.com/sunny-zuo/SE-bot/blob/main/server/server.js for non-forwarding setup
app.post('/adduser', (req, res) => {
    if (!req.body.discordId) {
        res.sendStatus(400);
        return;
    }
    mongo.getDB().collection("users").replaceOne({ discordId: req.body.discordId }, req.body, { upsert: true }).then(async (result) => {
        console.log(`Inserted Discord ID: ${req.body.discordId}`);

        const settingsMap = settings.getAll();
        for (const [guildId, guildSettings] of settingsMap) {
            if (guildSettings.verificationEnabled) {
                try {
                    const guild = await client.guilds.fetch(guildId);
                    if (!guild) { continue; }

                    const user = await guild.members.fetch(req.body.discordId);
                    if (!user) { continue; }

                    await assignRole(guild, guildSettings, user, req.body).catch(e => { console.log('Failed to assign role: ', e) });
                } catch (e) {
                    console.log(`Failed to add role to user in guild with id ${guildId}, likely due to permissions`);
                }
            }
        }

        res.sendStatus(200);
        
    }).catch(err => {
        console.log(`Failed to insert ${JSON.stringify(req.body)}`);
        console.log(err);
        res.sendStatus(500);
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Express server running on port ${process.env.PORT}`);
});

async function assignRole(guild, guildSettings, user, userInfo) {
    if (userInfo.department === guildSettings.verificationProgram) {
        let verifiedRole = guild.roles.cache.find(role => role.name === guildSettings.verifiedRole);
        if (!verifiedRole) {
            await guild.roles.fetch();
            verifiedRole = guild.roles.cache.find(role => role.name === guildSettings.verifiedRole);

            if (!verifiedRole) {
                return;
            }
        }

        return user.roles.add(verifiedRole, "Verified UW ID through bot");
    } else if (guildSettings.autoGuest) {
        let guestRole = guild.roles.cache.find(role => role.name === guildSettings.guestRole);
        if (!guestRole) {
            await guild.roles.fetch();
            guestRole = guild.roles.cache.find(role => role.name === guildSettings.guestRole);

            if (!guestRole) {
                return;
            }
        }

        return user.roles.add(guestRole, "Verified UW ID through bot (guest)");
    }
}

module.exports = { init, assignRole };