
const axios = require('axios');
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
    "summary": {
        usage: "[username]",
        description: "A summary of your profile or a given profile",
        process: ( bot, msg, suffix ) => {
        	if ( suffix ) {
        		sendSummary( msg, suffix );
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
    						sendSummary( msg, result.lichessName );
    					}
    			});
        	}
        }
    },
    "recent": {
        usage: "[rated/unrated]",
        description: "share your most recent game",
        process: ( bot, msg, suffix ) => {
            var rated = "";
            // test if the user wants a rated, unrated game, or most recent
            if ( suffix.includes('rated') ) {
                rated = "true";
            }
            else if ( suffix.includes('unrated') || suffix.substring('casual') ) {
                rated = "false";
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
                    sendGame( msg, result.lichessName, rated );
                }
            });
        }
    },
    "stats": {
        usage: "[user] <gamemode>",
        description: "Summarises your stats for a given game mode",
        process: ( bot, msg, suffix ) => {
            suffix = suffix.split( " " );
            if ( suffix.length < 1 ) {
                msg.channel.send("This command requires at least a game mode as an argument");
            }
            else if ( suffix.length === 1 ) {
                mode = suffix[0];
                User.findOne( { userId: msg.author.id }, ( err, result ) => {
                     if ( err ) {
                         console.log( err );
                     }
                     if ( !result ) {
                         msg.channel.send("You need to set your username first with `setuser`");
                     }
                     else {
                        sendStats( msg, result.lichessName, mode );
                     }
                });
            }
            else {
                // Send name and mode.
                sendStats( msg, suffix[ 0 ], suffix[ 1 ] );
            }
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
                        console.log(result.lichessName);
                        sendCurrent( msg, result.lichessName );
                     }
                });
            }
        }
    },
}
// Send ongoin game info
function sendCurrent ( msg, username ) {
    axios.get( 'https://lichess.org/api/user/' + username )
    .then( ( response ) => {
        var formattedMessage = formatCurrent( response.data );
        msg.channel.send(formattedMessage);
    })
    .catch( ( err ) => {
        console.log(err);
        msg.channel.send("An error occured with that request!");
    });
}


// Send stats of a game mode.
function sendStats ( msg, username, mode ) {
    axios.get( 'https://lichess.org/api/user/' + username )
        .then( ( response ) => {
            var formattedMessage = formatStats( response.data, mode );
            msg.channel.send(formattedMessage);
        })
        .catch( ( err ) => {
            console.log(err);
            msg.channel.send("An error occured with that request!");
        });
}
// summary command
function sendSummary ( msg, username ) {
	axios.get( 'https://lichess.org/api/user/' + username )
		.then( ( response ) => {
			var formattedMessage = formatSummary( response.data );
			msg.channel.send(formattedMessage);
		})
		.catch( ( err ) => {
			console.log("Error in sendSummary");
			msg.channel.send("An error occured with that request!");
		});
}
// Recent command
function sendGame ( msg, username, rated ) {
    // Accept only the x-ndjson type
    axios.get( 'https://lichess.org/games/export/' + username + "?max=1" + "&rated=" + rated,
        { headers: { 'Accept': 'application/x-ndjson' } } ) 
        .then( ( response ) => {
            var formattedMessage = formatGame( response.data );
            msg.channel.send(formattedMessage);
        })
        .catch( ( err ) => {
            console.log("error in sendGame");
            msg.channel.send("An error occured with that request!");
        });
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

// FOrmat stats
function formatStats ( list, mode ) {
    var formattedMessage;
    console.log(list);
    if ( list.perfs[mode] ) {
        formattedMessage =  
            "Stats for user " + list.username + ":\n" +
            "```" +
            mode + ": " +
            list.perfs[mode].games + " games, "  + list.perfs[mode].rating  + " (" + list.perfs[mode].prog + ") rating" +
            "```";  
    }
    else {
        formattedMessage = "That is an invalid mode!";
    }

    return formattedMessage;
}
// Returns a summary in discord markup of a user, returns nothing if error occurs.
function formatSummary ( data ) {
	var formattedMessage;
	formattedMessage = 
		data.url + "\n" +
		"```" +
		"User: "+ data.username + getHighestRating( data.perfs ) + " (" + ( data.online ? "online" : "offline" ) + ")"+"\n"+ 
		"Games: " + data.count.all + " (" + data.count.rated + " rated)\n"+
		"Favorite mode: " + getMostPlayed( data.perfs ) + "\n" + 
        "Time played: " + secondsToHours( data.playTime.total ) + " hours" + "\n" +
		"Completion rate: " + data.completionRate + "\n" +
		"Win rate: " + getWinrate( data ) + "\n" +
		"```";
	return formattedMessage;
}
// Format game
function formatGame ( data ) {
    var formattedMessage, playerLine;
    if ( data.players.white.ratingDiff ) {
        playerLine =
            data.players.white.user.name + " (" + data.players.white.rating + " " + data.players.white.ratingDiff + ")" + 
            " vs " + data.players.black.user.name + " (" + data.players.black.rating + " " + data.players.black.ratingDiff + ")" + "\n";
    }
    else { 
        playerLine =
            data.players.white.user.name + " (" + data.players.white.rating + ")" + 
            " vs " + data.players.black.user.name + " (" + data.players.black.rating + ")" + "\n";
    
    }
    formattedMessage = 
        "https://lichess.org/" + data.id + "\n" +
        "```" +
        playerLine +
        "Winner: "+ data.winner + "\n" +
        "```";
    return formattedMessage;
}
// Get the name, rating and progress of the most played mode
function getMostPlayed( list ) {
	var mostPlayed;
    var modes = modesArray( list );
	
    var mostPlayedMode = modes[0][0];
    var mostPlayedProg = modes[0][1].prog;
    var mostPlayedRating = modes[0][1].rating;
    var mostPlayedGames = modes[0][1].games;
    for ( var i = 0; i < modes.length; i++ ) {
        // exclude puzzle games, unless it is the only mode played by that user.
        if ( modes[i][0] != 'puzzle' ) {
            if ( modes[i][1].games > mostPlayedGames) {
                mostPlayedMode = modes[i][0];
                mostPlayedProg = modes[i][1].prog;
                mostPlayedRating = modes[i][1].rating;
                mostPlayedGames = modes[i][1].games;
            }
        }
    } 
    var formattedMessage = mostPlayedMode + " (" + mostPlayedGames + " games, rated " + mostPlayedRating + " (" + mostPlayedProg + "))";
	return formattedMessage;
}
// Get string with highest rating formatted for summary
function getHighestRating ( list ) {
    var modes = modesArray( list );

    var highestMode = modes[0][0];
    var highestProg = modes[0][1].prog;
    var highestRating = modes[0][1].rating;
    for ( var i = 0; i < list.length; i++ ) {
        if ( modes[i][1].rating > highestRating) {
            highestRating = modes[i].rating;
            highestMode = modes[i][0];
            highestProg = modes[i][1].prog;
        }
    }

	var formattedMessage = " (" + highestRating + " " + highestProg + " " + highestMode + ")";
	return formattedMessage;
}
// For sorting through modes... lichess api does not put these in an array so we do it ourselves
function modesArray ( list ) {
    //console.log( list );
    var array = [];
    // Count up number of keys...
    var count = 0;
        for(var key in list)
           if(list.hasOwnProperty(key))
                count++;
    // Set up the array.
    for ( var i = 0; i < count; i++ ) {
        array[i] = Object.entries( list )[ i ];
    }
    return array;
}
// Get winrate percentage
function getWinrate ( list ) {
	return ( list.count.win / list.count.all * 100 )+ "%";
}
function secondsToHours ( seconds ) {
    return ( ( seconds / 60 ) / 60 ).toFixed(2);
}

module.exports = {
	commands: commands
}