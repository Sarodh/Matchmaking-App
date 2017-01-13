var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = Schema (
{
    android_id: {
        type: String,
        unique : true, 
        index: true
    },
    status: Boolean,
    created: {
        type: Date, 
        default: Date.now
    },
    registrationId: String,
    rooms: [{ 
        type: Schema.Types.String, 
        ref: 'Chatrooms'
    }],
    interests: [{ 
        type: String, 
        ref: 'Interests' 
    }],
    foundUsers: [String],
    blockedUsers: [String],
    location: {
        coordinates: {type: [Number], index: '2dsphere'},
        country: String, 
        state: String
    },
    icon: {type: String, default: "none"},
    livefeed: {type: Boolean, default: false}
});

var Users = mongoose.model('Users', UserSchema);

module.exports = {
  model: Users
};