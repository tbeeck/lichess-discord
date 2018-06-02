const axios = require('axios');
// Set up UserSchema
var User = require('./userSchema').User;

var commands = {
    "tim": {
        usage: "",
        description: "tells you who tim is",
        process: ( bot, msg ) => {
            bot.reply(msg, "Tim is known as 'doorbell'");
        }
    }
}

module.exports = {
	commands: commands
}