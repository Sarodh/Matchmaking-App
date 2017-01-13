
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MessageSchema = Schema 
({
    message: String, 
    count: { seq: 0},
    created: {
        type: Date, 
        default: Date.now 
    }, 
    to: String,
});

var RoomSchema = new Schema ({
    // controller generated roomname for a match 
    //Roomname: {
    //    type: String, 
    //    unique : true
    //},
    _id: { type: String, unique : true}, 
    // android ids of the users in a room
    ids: {type: Array},
    // subdocument to store messages associated with a rooom
    messages: [MessageSchema],
    userNum: Number,
    status: Boolean,    
    created: {
        type: Date, 
        default: Date.now
    },
});

var Chatrooms = mongoose.model('Chatrooms', RoomSchema);
module.exports = {
  model: Chatrooms
};
