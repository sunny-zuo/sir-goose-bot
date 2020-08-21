const mongo = require('./mongo');

let servers = new Map();

const defaultSettings = {
    prefix: "~",
    verificationEnabled: false,
    verificationProgram: "VPA/Software Engineering",
    verifiedRole: "SE",
    guestRole: "Non-SE",
    autoGuest: true
}

const loadSettings = () => {
    return mongo.getDB().collection("settings").find({}).toArray(function (err, result) {
        if (err) throw err;
        result.forEach(setting => {
            servers.set(setting.serverID, setting);
        });
        console.log("Settings loaded successfully");
    });
}

const get = (serverID) => {
    // return server data if exists, else default settings
    return servers.get(serverID) || { ...defaultSettings, serverID: serverID };
}

const set = (serverID, settings) => {
    servers.set(serverID, settings);
    mongo.getDB().collection("settings").replaceOne({ serverID: serverID }, settings, { upsert: true });
}

module.exports = { get, set, loadSettings };