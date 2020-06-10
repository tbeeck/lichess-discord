const convertSeconds = require('convert-seconds')
const plural = require('plural')
// Set up UserSchema
function formatSeconds(seconds) {
    var duration = convertSeconds(seconds);
    duration.days = Math.floor(seconds / 60 / 60 / 24);
    duration.hours = duration.hours % 24;
    var message = '';
    if (duration.days)
        message += duration.days + ' ' + plural('day', duration.days);
    if (duration.hours) {
        if (duration.days)
            message += ', ';
        message += duration.hours + ' ' + plural('hour', duration.hours);
    }
    if (duration.minutes) {
        if (duration.days || duration.hours)
            message += ', ';
        message += duration.minutes + ' ' + plural('minute', duration.minutes);
    }
    return message;
}

module.exports = {
    formatSeconds: formatSeconds
}
