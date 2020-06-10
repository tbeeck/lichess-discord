const config = require('../config.json');
const commands = require('../commands');

function getHelp() {
    var helpText = '';
    for (var cmd in commands) {
        var info = config.prefix + cmd;
        var usage = commands[cmd].usage;
        if (usage) {
            info += ' ' + usage;
        }
        var description = commands[cmd].description;
        if (description) {
            info += '\n\t' + description;
        }
        helpText += '```' + info + '```';
    }
    return helpText;
}

function help(bot, msg, suffix) {
    msg.author.send(`Available Commands: \n${getHelp()}`);
}

module.exports = help;