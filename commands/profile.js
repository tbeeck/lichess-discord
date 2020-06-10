const axios = require('axios');
const Discord = require('discord.js');
const countryFlags = require('emoji-flags');
const plural = require('plural');
const formatSeconds = require('../lib/format-seconds');
const User = require('../models/User');

function sendProfile(msg, username, favoriteMode) {
    axios.get('https://lichess.org/api/user/' + username)
        .then((response) => {
            let formattedMessage = formatProfile(response.data, favoriteMode);
            msg.channel.send(formattedMessage);
        })
        .catch((err) => {
            console.log(`Error in profile: \
                ${suffix} ${err.response.status}  ${err.response.statusText}`);
            msg.channel.send(`An error occured with your request: \
                ${err.response.status} ${err.response.statusText}`);
        });
}

// Returns a profile in discord markup of a user, returns nothing if error occurs.
function formatProfile(data, favoriteMode) {
    if (data.closed)
        return 'This account is closed.';

    var colorEmoji;
    if (data.playing) {
        colorEmoji = data.playing.includes('white') ? '⚪' : '⚫';
    }
    var status = (!data.online ? '🔴 Offline' : (colorEmoji ? colorEmoji + ' Playing' : '📶 Online'));
    if (data.streaming)
        status = '📡 Streaming  ' + status;

    var flag = '';
    if (data.profile && data.profile.country)
        flag = countryFlags.countryCode(data.profile.country).emoji;

    var playerName = data.username;
    if (data.title)
        playerName = data.title + ' ' + playerName;

    var mostPlayedMode = getMostPlayedMode(data.perfs, favoriteMode);
    var formattedMessage = new Discord.RichEmbed()
        .setAuthor(flag + ' ' + playerName + '  ' + status, null, data.url)
        .setTitle('Challenge ' + data.username + ' to a game!')
        .setURL('https://lichess.org/?user=' + data.username + '#friend')
        .setColor(0xFFFFFF)
        .addField('Games ', data.count.rated + ' rated, ' + (data.count.all - data.count.rated) + ' casual', true)
        .addField('Rating (' + mostPlayedMode + ')', getMostPlayedRating(data.perfs, mostPlayedMode), true)
        .addField('Time Played', formatSeconds.formatSeconds(data.playTime.total), true)
        .addField('Win Expectancy ', getWinExpectancy(data), true);

    return formattedMessage;
}

function getMostPlayedMode(list, favoriteMode) {
    var modes = modesArray(list);

    var mostPlayedMode = modes[0][0];
    var mostPlayedGames = modes[0][1].games;
    for (var i = 0; i < modes.length; i++) {
        // exclude puzzle games, unless it is the only mode played by that user.
        if (modes[i][0] != 'puzzle' && modes[i][1].games > mostPlayedGames) {
            mostPlayedMode = modes[i][0];
            mostPlayedGames = modes[i][1].games;
        }
    }
    for (var i = 0; i < modes.length; i++) {
        if (modes[i][0].toLowerCase() == favoriteMode) {
            mostPlayedMode = modes[i][0];
            mostPlayedGames = modes[i][1].games;
        }
    }
    return mostPlayedMode;
}
// Get string with highest rating formatted for profile
function getMostPlayedRating(list, mostPlayedMode) {
    var modes = modesArray(list);

    var mostPlayedRD = modes[0][1].rd;
    var mostPlayedProg = modes[0][1].prog;
    var mostPlayedRating = modes[0][1].rating;
    var mostPlayedGames = modes[0][1].games;
    for (var i = 0; i < modes.length; i++) {
        // exclude puzzle games, unless it is the only mode played by that user.
        if (modes[i][0] == mostPlayedMode) {
            mostPlayedRD = modes[i][1].rd;
            mostPlayedProg = modes[i][1].prog;
            mostPlayedRating = modes[i][1].rating;
            mostPlayedGames = modes[i][1].games + ' ' + plural((mostPlayedMode == 'puzzle' ? 'attempt' : ' game'), modes[i][1].games);
        }
    }
    if (mostPlayedProg > 0)
        mostPlayedProg = ' ▲' + mostPlayedProg + '📈';
    else if (mostPlayedProg < 0)
        mostPlayedProg = ' ▼' + Math.abs(mostPlayedProg) + '📉';
    else
        mostPlayedProg = '';

    var formattedMessage = mostPlayedRating + ' ± ' + (2 * mostPlayedRD) +
        mostPlayedProg + ' over ' + mostPlayedGames;
    return formattedMessage;
}
// For sorting through modes... lichess api does not put these in an array so we do it ourselves
function modesArray(list) {
    var array = [];
    // Count up number of keys...
    var count = 0;
    for (var key in list)
        if (list.hasOwnProperty(key))
            count++;
    // Set up the array.
    for (var i = 0; i < count; i++) {
        array[i] = Object.entries(list)[i];
    }
    return array;
}

// Get win/result expectancy (draws count as 0.5)
function getWinExpectancy(list) {
    var score = list.count.win + (list.count.draw / 2);
    return (score / list.count.all * 100).toFixed(1) + '%';
}

function profile(bot, msg, suffix) {
    if (suffix) {
        sendProfile(msg, suffix, '');
    }
    else {
        User.findOne({ userId: msg.author.id }, (err, result) => {
            if (err) {
                console.log(err);
                msg.channel.send(`There was an error with your request.`);
            }
            if (!result) {
                msg.channel.send(`You need to set your username with \`setuser\`!`);
            } else {
                sendProfile(msg, result.lichessName, result.favoriteMode);
            }
        });
    }
}

module.exports = profile;