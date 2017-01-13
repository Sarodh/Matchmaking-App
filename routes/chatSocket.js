var Chatrooms = require('../models/chatrooms').model;
var Users = require('../models/users').model;
var Message = require('node-xcs').Message;
var async = require('async');


module.exports = function(io) {
    // Chatroom with GCM
    io.sockets.on('connection', function (socket) {
        // Handle picture message requests
        socket.on('new picture', function(url) {
            socket.broadcast.to(socket.roomName).emit('new picture', {link: url});
        });
        // Create chatroom using multiplied roomhash
        socket.on("CreateRoom",function(roomName, userId, matchedId) {
            async.waterfall([
                function(callback) {
                    socket.join(roomName);
                    socket.userId = userId;
                    socket.roomName = roomName;
                    Users.findOne({android_id: userId},'registrationId' , function(err, results) {
                        if(err) console.log(err);
                        else if(results) {
                            socket.matchedId = results.registrationId;
                            callback(null, results.registrationId);
                        }
                    });
                },
                function(gcmID, callback) {
                    var room = io.sockets.adapter.rooms[socket.roomName];
                    var messageX = new Message("readStatus")
                        .priority("high")
                        .dryRun(false)
                        .addData("roomID", socket.roomName)
                        .addData("msgType", 5)
                        .deliveryReceiptRequested(true)
                        .build();
                
                    if(Object.keys(room).length == 2) {
                        socket.broadcast.to(roomName).emit('CreateRoom', {read: true});
                    } else {
                        global.xcs.sendNoRetry(messageX, socket.matchedId, function (result) {
                            if (result.getError()) {
                                console.error(result.getErrorDescription());
                            } else console.log("CreateRoom XMPP sent: #"); //.getMessageId());
                        });
                    }
                },
            ]);
        });
        
        // Update read/delviered message status when both users are in the room 
        socket.on("Read Live", function(read) {
            socket.broadcast.to(socket.roomName).emit('Read Live', {read: true});
        });
        
        // Emit to a room via a websocket and GCM   
        socket.on("Chatroom", function (message) {
            var clients = Object.keys(io.sockets.adapter.rooms[socket.roomName]).length;
            

            // Send XMPP when only 1 user is connected to the room.     
            if(clients == 1 && socket.matchedId != null) {
                var messageX = new Message("message")
                    .priority("high")
                    .dryRun(false)
                    .addData("roomID", socket.roomName)
                    .addData("userID", socket.userId)
                    .addData("message", message)
                    .addData("msgType", 2)
                    .deliveryReceiptRequested(true)
                    .build();
                    
                global.xcs.sendNoRetry(messageX, socket.matchedId, function (result) {
                    if (result.getError()) {
                        console.error(result.getErrorDescription());
                    } else {
                        console.log("Chatroom XMPP sent: #", result); //.getMessageId());
                    }
                });
            } else {
                socket.broadcast.to(socket.roomName).emit('Chatroom', {message: message, roomhash: socket.roomName});
            }
    });
    
    // Update if typing 
    socket.on('typing', function (status) {         
        socket.broadcast.to(socket.roomName).emit('typing',{status: status});
    });
    
    // Emit picture message url to other user in room
    socket.on('New Picture', function (image_url) {
        socket.broadcast.to(socket.roomName).emit('New Picture',{"image_url": image_url, "room": socket.roomName});
        var clients = Object.keys(io.sockets.adapter.rooms[socket.roomName]).length;
        
        if(clients == 1) {
            var messageX = new Message("message")
                .priority("high")
                .dryRun(false)
                .addData("roomID", socket.roomName)
                .addData("iconURL", image_url)
                .addData("msgType", 6)
                .deliveryReceiptRequested(true)
                .build(); 
                
             global.xcs.sendNoRetry(messageX, socket.matchedId, function (result) {
                    if (result.getError()) {
                        console.error(result.getErrorDescription());
                    } else {
                        console.log("New Picture XMPP sent: #", result); //.getMessageId());
                    }
            });    
        }
    });
    
    socket.on('disconnect', function (err) {
        if(err) console.log(err);
    });
});

};

