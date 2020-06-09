const Discord = require('discord.js');
const axios = require('axios');
const countryFlags = require('emoji-flags');
const formatSeconds = require('./format-seconds');
const plural = require('plural');
// Set up UserSchema
var User = require('./userSchema').User;

var commands = {
    "setuser": {
    	usage: "<lichess name>",
    	description: "Sets your lichess username",
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
    				if ( ( new Date() - result.dateAdded ) < ( 60 * 1000 ) ) { // 1 minute
    					msg.channel.send("You may update your name once per minute. Try again later.");
    				}
    				else {
    					var newValues = { $set: { lichessName: username, dateAdded: new Date() } };
    					User.updateOne({ userId: authorId }, newValues, ( err, updateResult ) => {
    						msg.channel.send("User updated! " + msg.author.username + " = " + username);
    					});
    				}
    			}
    		});
    	}
    },
    "whoami": {
        usage: "",
        description: "Returns your lichess username",
        process: ( bot, msg ) => {
          User.findOne( { userId: msg.author.id }, ( err, result ) => {
    				if ( err ) {
    					console.log( err );
    				}
    				if ( !result ) {
    					msg.channel.send("You need to set your lichess username with setuser!");
    				}
    				else {
    					msg.channel.send(msg.author.username + " is lichess user " + result.lichessName);
    				}
    			});
        }
    },
    "setgamemode": {
    	usage: "[game mode]",
    	description: "Sets your favorite game (or puzzle) mode",
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
    "profile": {
        usage: "[username]",
        description: "Displays your (or a user's) profile",
        process: ( bot, msg, suffix ) => {
        	if ( suffix ) {
        		sendProfile( msg, suffix, '' );
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
    						sendProfile( msg, result.lichessName, result.favoriteMode );
    					}
    			});
        	}
        }
    },
    "recent": {
        usage: "[rated/casual]",
        description: "Shares your most recent game",
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
                    msg.channel.send("You need to set your lichess username with setuser!");
                }
                else {
                    sendRecentGame( msg, result.lichessName, rated );
                }
            });
        }
    },
    "playing": {
        usage: "[user]",
        description: "Shares your (or a user's) ongoing game",
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
                         msg.channel.send("You need to set your lichess username with setuser!");
                     }
                     else {
                        sendCurrent( msg, result.lichessName );
                     }
                });
            }
        }
    },
    "tv": {
        usage: "[game mode]",
        description: "Shares the featured game",
        process: ( bot, msg, suffix ) => {
            if ( suffix ) {
                sendTv( msg, suffix );
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
                        sendTv( msg, result.favoriteMode );
                    }
                });
            }
        }
    },
    "arena": {
        usage: "[user]",
        description: "Find an upcoming or recent arena created by lichess (or a user)",
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

// Send ongoing game info
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

// profile command
function sendProfile ( msg, username, favoriteMode ) {
	axios.get( 'https://lichess.org/api/user/' + username )
		.then( ( response ) => {
			var formattedMessage = formatProfile( response.data, favoriteMode );
			msg.channel.send(formattedMessage);
		})
		.catch( ( err ) => {
			console.log(err);
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

// Send ongoing game info
function sendTv ( msg, favoriteMode ) {
    axios.get( 'https://lichess.org/tv/channels' )
    .then( ( response ) => {
        var formattedMessage = formatTv( response.data, favoriteMode );
        msg.channel.send(formattedMessage);
    })
    .catch( ( err ) => {
		console.log( "Error in sendTv: " + favoriteMode + " " + err.response.status + " " + err.response.statusText );
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

// Returns a profile in discord markup of a user, returns nothing if error occurs.
function formatProfile ( data, favoriteMode ) {
  if (data.closed)
      return "This account is closed.";

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
    .addField("Rating (" + mostPlayedMode + ")", getMostPlayedRating(data.perfs, mostPlayedMode), true)
    .addField("Time Played", formatSeconds.formatSeconds(data.playTime.total), true)
    .addField("Win Expectancy ", getWinExpectancy(data), true);

	return formattedMessage;
}
// Format recent game
function formatRecentGame ( data ) {
    return "https://lichess.org/" + data.id;
}

// Format TV
function formatTv ( data, favoriteMode ) {
    for ( var channel in data ) {
        if ( channel.toLowerCase() == favoriteMode )
            return "https://lichess.org/" + data[channel].gameId;
    }
    return "No channel of mode " + favoriteMode + " found!";
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
// Get string with highest rating formatted for profile
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

module.exports = {
	commands: commands,
	formatSeconds: formatSeconds
}
