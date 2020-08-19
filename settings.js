let servers = new Map();

const defaultSettings = {
    prefix: "~"
}

// insert function to fetch settings from db on init here

const get = (serverID) => {
    // return server data if exists, else default settings
    return servers.get(serverID) || defaultSettings;
}

const set = (serverID, settings) => {
    servers.set(serverID, settings);
    // insert function to write settings to db here
}

module.exports = { get, set };