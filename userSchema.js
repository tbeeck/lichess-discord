var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  lichessName: {
    type: String,
    required: true
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
});

var User = mongoose.model('User', UserSchema);

module.exports = {
  User: User
}
