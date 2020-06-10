const config = require('../config.json');

function stop(bot, msg, suffix) {
    if (msg.author.id == config.owner) {
        process.exit();
    }
}

module.exports = stop;