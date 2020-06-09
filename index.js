const config = require('./config.json');
const Discord = require('discord.js');

// Set up the database
const mongoose = require('mongoose');
mongoose.connect(config.mongourl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Initialize bot
const bot = new Discord.Client({
    disableEveryone: true,
    disabledEvents: ['TYPING_START']
});
if (config.discordbotstoken) {
    const express = require('express');
    const http = require('http');
    const server = http.createServer(express());
    server.listen(config.discordbotswebhookport, () => {
        console.log('Listening');
    });
    const DBL = require('dblapi.js');
    const dbl = new DBL(config.discordbotstoken,
        { webhookPort: config.discordbotswebhookport, webhookServer: server }, bot);
}

// Set up commands
const commands = require('./commands');

bot.on("ready", () => {
    bot.user.setActivity('lichess.org'); //you can set a default game
    console.log(`Bot is online!\n${bot.users.size} users, in ${bot.guilds.size} servers connected.`);
});

bot.on("guildCreate", (guild) => {
    console.log(`I've joined the guild ${guild.name} (${guild.id}), owned by ${guild.owner.user.username}.`);
});

bot.on("message", (msg) => {
    //drop bot messages (including our own) to prevent feedback loops
    if (msg.author.bot) {
        return;
    }
    //start special commands
    if ((msg.content[0] === config.prefix)) {
        var cmdTxt = msg.content.split(" ")[0].substring(1);
        var suffix = msg.content.substring(cmdTxt.length + 2);
    }
    if (cmdTxt === "help") {
        var helpText = "";
        for (var cmd in commands) {
            var info = config.prefix + cmd;
            var usage = commands[cmd].usage;
            if (usage) {
                info += " " + usage;
            }
            var description = commands[cmd].description;
            if (description) {
                info += "\n\t" + description;
            }
            helpText += "```" + info + "```";
        }
        msg.author.send("Available Commands:" + helpText);
        return;
    } else if (cmdTxt === "stop" && msg.author.id == config.owner) {
        bot.logout();
        process.exit();
    }
    //end special commands, handle normal commands
    for (var cmd in commands) {
        if (cmd === cmdTxt) {
            console.log("treating " + msg.content + " from " + msg.author + "(" + msg.author.username + ") as command");
            try {
                commands[cmd].process(bot, msg, suffix);
            }
            catch (e) {
                console.log("command failed:\n" + e.stack)
                if (config.debug) {
                    msg.channel.send("command " + cmdTxt + " failed :(\n" + e.stack);
                }
            }
            return;
        }
    }
    if (config.respondToInvalid) {
        bot.sendMessage(msg.channel, "Invalid command " + cmdTxt);
    }
});

// Catch Errors before they crash the app.
process.on('uncaughtException', (err) => {
    const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, 'g'), './');
    console.error('Uncaught Exception: ', errorMsg);
    process.exit(1); //Gracefully exit so systemd service may restart
});

process.on('unhandledRejection', err => {
    console.error('Uncaught Promise Error: ', err);
    process.exit(1); //Gracefully exit so systemd service may restart
});

bot.login(config.token);
