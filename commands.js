const Discord = require('discord.js');
const axios = require('axios');
const countryFlags = require('emoji-flags');
const convertSeconds = require('convert-seconds')
const plural = require('plural')
// Set up UserSchema
var User = require('./userSchema').User;

var commands = {
    "setuser": {
    	usage: "<lichess name>",
    	description: "set your lichess username",
    	process: ( bot, msg, suffix ) => {
    		var authorId = msg.author.id;
    		var username = suffix;
    		User.findOne( { userId: authorId }, ( err, result ) => {
    			if ( err ) {
    				console.log( err );
    			}
    			if ( !result ) {
    				User.create({ userId: authorId, lichessName: username }, ( err, createResult ) => {
    					msg.channel.send("User added! " + msg.author.username + " = " + username);
    				});
    			}
    			else {
    				if ( ( new Date() - result.dateAdded ) < ( 60 * 60 * 1000 ) ) { // 1 hour
    					msg.channel.send("You may update your name once per hour. Try again later.");
    				}
    				else {
    					var newValues = { $set: { lichessName: username, dateAdded: new Date() } };
    					User.updateOne({ userId: authorId }, newValues, ( err, updateResult ) => {
    						msg.channel.send("User updated! " + msg.author.username + " is now lichess user " + username);
    					});
    				}
    			}
    		});
    	}
    },
    "whoami": {
        usage: "",
        description: "Returns your current lichess username",
        process: ( bot, msg ) => {
          User.findOne( { userId: msg.author.id }, ( err, result ) => {
    				if ( err ) {
    					console.log( err );
    				}
    				if ( !result ) {
    					msg.channel.send("No user found under that name!");
    				}
    				else {
    					msg.channel.send(msg.author.username + " is lichess user " + result.lichessName);
    				}
    			});
        }
    },
    "setgamemode": {
    	usage: "<game mode>",
    	description: "set your favorite game mode (puzzle for puzzle mode)",
    	process: ( bot, msg, suffix ) => {
    		var authorId = msg.author.id;
    		var mode = suffix.toLowerCase();
    		User.findOne( { userId: authorId }, ( err, result ) => {
    			if ( err ) {
    				console.log( err );
    			}
    			if ( !result ) {
    				msg.channel.send("You need to set your lichess username with setuser!");
    			}
    			else {
    				var newValues = { $set: { favoriteMode: mode } };
    				User.updateOne({ userId: authorId }, newValues, ( err, updateResult ) => {
    					msg.channel.send(msg.author.username + " favorite mode updated!");
    				});
    			}
    		});
    	}
    },
    "summary": {
        usage: "[username]",
        description: "A summary of your profile or a given profile",
        process: ( bot, msg, suffix ) => {
        	if ( suffix ) {
        		sendSummary( msg, suffix, '' );
        	}
        	else {
        		User.findOne( { userId: msg.author.id }, ( err, result ) => {
    					if ( err ) {
    						console.log( err );
    					}
    					if ( !result ) {
    						msg.channel.send("You need to set your lichess username with setuser!");
    					}
    					else {
    						sendSummary( msg, result.lichessName, result.favoriteMode );
    					}
    			});
        	}
        }
    },
    "recent": {
        usage: "[rated/casual]",
        description: "share your most recent game",
        process: ( bot, msg, suffix ) => {
            var rated = "";
            // test if the user wants a rated, casual game, or most recent
            if (suffix.includes('casual') || suffix.includes('unrated')) {
                rated = "false";
            }
            else if (suffix.includes('rated')) {
                rated = "true";
            }
            else {
                rated = "";
            }
            User.findOne( { userId: msg.author.id }, ( err, result ) => {
                if ( err ) {
                    console.log( err );
                }
                if ( !result ) {
                    msg.channel.send("No user found under that name!");
                }
                else {
                    sendRecentGame( msg, result.lichessName, rated );
                }
            });
        }
    },
    "playing": {
        usage: "[user]",
        description: "shares your ongoing game",
        process: ( bot, msg, suffix ) => {
            if ( suffix ) {
                sendCurrent( msg, suffix );
            }
            else {
                // Send name.
                User.findOne( { userId: msg.author.id }, ( err, result ) => {
                     if ( err ) {
                         console.log( err );
                     }
                     if ( !result ) {
                         msg.channel.send("You need to set your username first with `setuser`");
                     }
                     else {
                        sendCurrent( msg, result.lichessName );
                     }
                });
            }
        }
    },
    "arena": {
        usage: "[user]",
        description: "Find an upcoming or recent arena",
        process: ( bot, msg, suffix ) => {
            User.findOne( { userId: msg.author.id }, ( err, result ) => {
                var favoriteMode = "";
                if ( err ) {
                    console.log( err );
                }
                favoriteMode = result.favoriteMode;
                if ( suffix ) {
                    sendArena( msg, suffix, favoriteMode );
                } else {
                    sendArena( msg, "lichess", favoriteMode );
                }
            });
        }
    }
}

// Send ongoin game info
function sendArena ( msg, suffix, favoriteMode ) {
    axios.get( 'https://lichess.org/api/tournament' )
    .then( ( response ) => {
        var formattedMessage = formatArena( response.data, suffix, favoriteMode );
        msg.channel.send(formattedMessage);
    })
    .catch( ( err ) => {
		console.log( "Error in sendArena: " + suffix + " " + err.response.status + " " + err.response.statusText );
		msg.channel.send("An error occured with your request: " + err.response.status + " " + err.response.statusText );
    });
}

// Send ongoin game info
function sendCurrent ( msg, username ) {
    axios.get( 'https://lichess.org/api/user/' + username )
    .then( ( response ) => {
        var formattedMessage = formatCurrent( response.data );
        msg.channel.send(formattedMessage);
    })
    .catch( ( err ) => {
		console.log( "Error in sendCurrent: " + username + " " + err.response.status + " " + err.response.statusText );
		msg.channel.send("An error occured with your request: " + err.response.status + " " + err.response.statusText );
    });
}

// summary command
function sendSummary ( msg, username, favoriteMode ) {
	axios.get( 'https://lichess.org/api/user/' + username )
		.then( ( response ) => {
			var formattedMessage = formatSummary( response.data, favoriteMode );
			msg.channel.send(formattedMessage);
		})
		.catch( ( err ) => {
			console.log( "Error in sendSummary: " + username + " " + err.response.status + " " + err.response.statusText );
			msg.channel.send("An error occured with your request: " + err.response.status + " " + err.response.statusText );
		});
}
// Recent game command
function sendRecentGame ( msg, username, rated ) {
    // Accept only the x-ndjson type
    axios.get( 'https://lichess.org/games/export/' + username + "?max=1" + "&rated=" + rated,
        { headers: { 'Accept': 'application/x-ndjson' } } )
        .then( ( response ) => {
            var formattedMessage = formatRecentGame( response.data );
            msg.channel.send(formattedMessage);
        })
        .catch( ( err ) => {
            console.log("error in sendRecentGame: " + username + " " + rated + " " + err.response.status + " " + err.response.statusText );
            msg.channel.send("An error occured with your request: " + err.response.status + " " + err.response.statusText );
        });
}

// Format arena
function formatArena ( data, createdBy, favoriteMode ) {
    for ( var status in data ) {
        var arenas = data[status];
        for ( var i = 0; i < arenas.length; i++ ) {
            if ( arenas[i].variant.key.toLowerCase() == favoriteMode && arenas[i].createdBy == createdBy )
                return "https://lichess.org/tournament/" + arenas[i].id;
        }
    }
    for ( var status in data ) {
        var arenas = data[status];
        for ( var i = 0; i < arenas.length; i++ ) {
            if ( arenas[i].createdBy == createdBy )
                return "https://lichess.org/tournament/" + arenas[i].id;
        }
    }
    return "No tournament created by " + createdBy + " found!";
}

// Format playing
function formatCurrent ( data ) {
    var formattedMessage;
    if ( data.playing ) {
        formattedMessage = data.playing;
    }
    else {
        formattedMessage = "No current games found!";
    }
    return formattedMessage;
}

// Returns a summary in discord markup of a user, returns nothing if error occurs.
function formatSummary ( data, favoriteMode ) {
  var colorEmoji;
  if (data.playing) {
    colorEmoji = data.playing.includes("white") ? "⚪" : "⚫";
  }
  var status = ( !data.online ? "🔴 Offline" : ( colorEmoji ? colorEmoji + " Playing" : "📶 Online" ) );
  if ( data.streaming )
      status = "📡 Streaming  " + status;

  var flag = "";
  if (data.profile && data.profile.country)
      flag = countryFlags.countryCode(data.profile.country).emoji;

  var playerName = data.username;
  if (data.title)
      playerName = data.title + " " + playerName;

  var mostPlayedMode = getMostPlayedMode(data.perfs, favoriteMode);
  var formattedMessage = new Discord.RichEmbed()
    .setAuthor(flag + " " + playerName + "  " + status, null, data.url)
    .setTitle("Challenge " + data.username + " to a game!")
    .setURL("https://lichess.org/?user=" + data.username + "#friend")
    .setColor(0xFFFFFF)
    .addField("Games ", data.count.rated + " rated, " + (data.count.all - data.count.rated) + " casual", true)
    .addField("Rating (" + toTitleCase ( mostPlayedMode ) + ")", getMostPlayedRating(data.perfs, mostPlayedMode), true)
    .addField("Time Played", formatSeconds(data.playTime.total), true)
    .addField("Win Expectancy ", getWinExpectancy(data), true);

	return formattedMessage;
}
// Format recent game
function formatRecentGame ( data ) {
    return "https://lichess.org/" + data.id;
}

function getMostPlayedMode( list, favoriteMode ) {
    var modes = modesArray( list );

    var mostPlayedMode = modes[0][0];
    var mostPlayedGames = modes[0][1].games;
    for ( var i = 0; i < modes.length; i++ ) {
        // exclude puzzle games, unless it is the only mode played by that user.
        if ( modes[i][0] != 'puzzle' && modes[i][1].games > mostPlayedGames ) {
            mostPlayedMode = modes[i][0];
            mostPlayedGames = modes[i][1].games;
        }
    }
    for ( var i = 0; i < modes.length; i++ ) {
        if ( modes[i][0].toLowerCase() == favoriteMode ) {
            mostPlayedMode = modes[i][0];
            mostPlayedGames = modes[i][1].games;
        }
    }
    return mostPlayedMode;
}
// Get string with highest rating formatted for summary
function getMostPlayedRating( list, mostPlayedMode ) {
    var modes = modesArray( list );

    var mostPlayedRD = modes[0][1].rd;
    var mostPlayedProg = modes[0][1].prog;
    var mostPlayedRating = modes[0][1].rating;
    var mostPlayedGames = modes[0][1].games;
    for ( var i = 0; i < modes.length; i++ ) {
        // exclude puzzle games, unless it is the only mode played by that user.
        if ( modes[i][0] == mostPlayedMode ) {
            mostPlayedRD = modes[i][1].rd;
            mostPlayedProg = modes[i][1].prog;
            mostPlayedRating = modes[i][1].rating;
            mostPlayedGames = modes[i][1].games + " " + plural((mostPlayedMode == "puzzle" ? "attempt" : " game"), modes[i][1].games);
        }
    }
    if (mostPlayedProg > 0)
        mostPlayedProg = " ▲" + mostPlayedProg + "📈";
    else if (mostPlayedProg < 0)
        mostPlayedProg = " ▼" + Math.abs( mostPlayedProg ) + "📉";
    else
        mostPlayedProg = "";

    var formattedMessage = mostPlayedRating + " ± " + ( 2 * mostPlayedRD ) +
        mostPlayedProg + " over " + mostPlayedGames;
    return formattedMessage;
}
// For sorting through modes... lichess api does not put these in an array so we do it ourselves
function modesArray ( list ) {
    var array = [];
    // Count up number of keys...
    var count = 0;
        for(var key in list)
           if(list.hasOwnProperty(key))
                count++;
    // Set up the array.
    for ( var i = 0; i < count; i++ ) {
        array[i] = Object.entries(list)[i];
    }
    return array;
}
// Get win/result expectancy (draws count as 0.5)
function getWinExpectancy ( list ) {
    var score = list.count.win + ( list.count.draw / 2 );
	return ( score / list.count.all * 100 ).toFixed(1)+ "%";
}
function formatSeconds ( seconds ) {
  var duration = convertSeconds( seconds );
  duration.days = Math.floor(seconds / 60 / 60 / 24);
  duration.hours = duration.hours % 24;
  var message = duration.seconds + " " + plural("second", duration.seconds);
  if ( duration.minutes )
      message = duration.minutes + " " + plural("minute", duration.minutes);
  if ( duration.hours )
      message = duration.hours + " " + plural("hour", duration.hours) + ", " + message;
  if ( duration.days )
      message = duration.days + " " + plural("day", duration.days) + ", " + message;
  return message;
}
function toTitleCase ( str ) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

module.exports = {
	commands: commands
}
