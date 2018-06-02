const axios = require('axios');
// Set up UserSchema
var User = require('./userSchema').User;

var commands = {
    "tim": {
        usage: "",
        description: "tells you who tim is",
        process: ( bot, msg ) => {
          msg.channel.send("Tim is known as 'doorbell'");
        }
    },
    "setuser": {
    	usage: "setuser <lichess name>",
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
    				if ( new Date() - result.dateAdded > ( 60 * 60 * 1000 ) ) { // 1 hour
    					msg.channel.send("You may update your name once per hour. Try again later.");
    				}
    				else {
    					var newValues = { $set: { lichessName: username, dateAdded: Date.now } };
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
}


// summary command
function sendSummary ( msg, username ) {
	axios.get( 'https://lichess.org/api/user/' + username )
		.then( ( response ) => {
			var formattedMessage = formatSummary( response.data );
			msg.channel.send(formattedMessage);
		})
		.catch( ( err ) => {
			console.log(err);
			msg.channel.send("An error occured with that request!");
		});
}
// Returns a summary in discord markup of a user, returns nothing if error occurs.
function formatSummary ( data ) {
	var formattedMessage;
	formattedMessage = 
		data.url + "\n" +
		"```" +
		"User: "+ data.username + getHighestRating( data.perfs ) +"\n"+ 
		"Games: " + data.count.all + " (" + data.count.rated + " rated)\n"+
		"Favorite mode: " + getMostPlayed( data.perfs ) + "\n" + 
		"Completion rate: " + data.completionRate + "\n" +
		"Win rate: " + getWinrate( data ) + "\n" +
		"```";
	return formattedMessage;
}
// Get the name, rating and progress of the most played mode
function getMostPlayed( list ) {
	var mostPlayed;
	var modes = [ ["Blitz", list.blitz.games, list.blitz.rating, list.blitz.prog],
								["Bullet", list.bullet.games, list.bullet.rating, list.bullet.prog],
								["Correspondence", list.correspondence.games, list.correspondence.rating, list.correspondence.prog],
								["Rapid", list.rapid.games, list.rapid.rating, list.rapid.prog],
								["UltraBullet", list.ultraBullet.games, list.ultraBullet.rating, list.ultraBullet.prog],
								["Classical", list.classical.games, list.classical.rating, list.classical.prog] ];
	var max = Math.max(modes[0][1],modes[1][1],modes[2][1],modes[3][1],modes[4][1],modes[5][1]);
	for ( var i = 0; i < modes.length; i++ ) {
		if ( modes[i][1] === max ) {
			mostPlayed = modes[i];	
		}
	}
	var formattedMessage = mostPlayed[0] + " (" + mostPlayed[ 1 ] + " games, rated " + mostPlayed[ 2 ] + " (" +mostPlayed[ 3 ]+ "))";
	return formattedMessage;
}
// Get string with highest rating formatted for summary
function getHighestRating ( list ) {
	var highestRating;
	var modes = [ ["Blitz", list.blitz.games, list.blitz.rating, list.blitz.prog],
								["Bullet", list.bullet.games, list.bullet.rating, list.bullet.prog],
								["Correspondence", list.correspondence.games, list.correspondence.rating, list.correspondence.prog],
								["Rapid", list.rapid.games, list.rapid.rating, list.rapid.prog],
								["UltraBullet", list.ultraBullet.games, list.ultraBullet.rating, list.ultraBullet.prog],
								["Classical", list.classical.games, list.classical.rating, list.classical.prog] ];
	var max = Math.max(modes[0][2],modes[1][2],modes[2][2],modes[3][2],modes[4][2],modes[5][2]);
	for ( var i = 0; i < modes.length; i++ ) {
		if ( modes[i][2] === max ) {
			highestRating = modes[i];	
		}
	}
	var formattedMessage = " (" + highestRating[2] + " " + highestRating[3] + " " + highestRating[0] + ")";
	return formattedMessage;
}
// Get winrate percentage
function getWinrate ( list ) {
	return ( list.count.win / list.count.all * 100 )+ "%";
}

module.exports = {
	commands: commands
}