// Include commands
const arena = require('./commands/arena');
const deleteUser = require('./commands/deleteUser');
const setUser = require('./commands/setUser');
const playing = require('./commands/playing');
const profile = require('./commands/profile');
const recent = require('./commands/recent');
const setGameMode = require('./commands/setGameMode');
const tv = require('./commands/tv');
const whoAmI = require('./commands/whoAmI');

const commands = {
    "setuser": {
        usage: "<lichess name>",
        description: "Sets your lichess username",
        process: setUser
    },
    "deleteuser": {
        usage: "",
        description: "Deletes your lichess username from the bot's database",
        process: deleteUser
    },
    "whoami": {
        usage: "",
        description: "Returns your lichess username",
        process: whoAmI
    },
    "setgamemode": {
        usage: "[game mode]",
        description: "Sets your favorite game (or puzzle) mode",
        process: setGameMode
    },
    "profile": {
        usage: "[username]",
        description: "Displays your (or a user's) profile",
        process: profile
    },
    "recent": {
        usage: "[rated/casual]",
        description: "Shares your most recent game",
        process: recent
    },
    "playing": {
        usage: "[user]",
        description: "Shares your (or a user's) ongoing game",
        process: playing
    },
    "tv": {
        usage: "[game mode]",
        description: "Shares the featured game",
        process: tv
    },
    "arena": {
        usage: "[user]",
        description: "Find an upcoming or recent arena created by lichess (or a user)",
        process: arena
    }
};

module.exports = commands;
