const convertSeconds = require('convert-seconds')
const plural = require('plural')
// Set up UserSchema
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

module.exports = {
	formatSeconds: formatSeconds
}
