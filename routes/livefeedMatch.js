var express = require('express');
var router = express.Router();
var Users = require('../models/users').model;
var Chatrooms = require('../models/chatrooms').model;
var async = require('async');
var crypto = require('crypto');
var Message = require('node-xcs').Message;
var wlog = require('../services/wLogger.js');


router.post('/livefeedmatch', function(req, res) {
    
    CreateRoomHash(req.body.userID, req.body.id, function(err, rHash) {
        if(err) {
            wlog.err(err);
        } else if(rHash) {
            async.parallel([
                function(callback) {
                    Users.findOneAndUpdate({android_id: req.body.userID},{$addToSet: {rooms: rHash, foundUsers: req.body.id}, status: false}, function(err,worked) {
                        if(err) res.status(500).end();
                        else 
                            callback(null,worked.registrationId);
                    });
                }, 
                function(callback) {
                    Users.findOneAndUpdate({android_id: req.body.id},{$addToSet: {rooms: rHash, foundUsers: req.body.userID}, status: false}, function(err,worked) {
                        if(err) res.status(500).end();
                        else 
                            callback(null,worked.registrationId, worked.icon, worked.interests);
                    });
                },
                function(callback) {
                    Chatrooms.create({_id: rHash, userNum: 2, status: false, ids: [req.body.userID, req.body.id]}, function (err, worked) {
                        if(err) {
                            wlog.err(err);
                            res.status(500).end();
                        } else callback(null, true);
                    });
                }
            ], function(err, result) {
                if(err) { 
                    wlog.err(err);
                    res.status(500).end();
                } 
                else {
                    wlog.info("/livefeedmatch final results: ", result);
                    sendX(result[0], rHash, req.body.id, result[1][1], result[1][2], function(err, r) {
                        if(err) wlog.err(err);
                        else {
                            res.json({userID: req.body.userID, roomID: rHash}).end();
                        }
                    });
                }
            });  
        }
    });
});

module.exports = router;

function sendX(to, roomID, userID, URL, interests, cb) {
    console.log("To: " + to);
    console.log("roomID: " + roomID);
    console.log("userID" + userID);
    console.log("iconURL" + URL);

     var messageX = new Message(userID)
        .priority("high")
        .dryRun(false)
        .addData("roomID", roomID)
        .addData("userID", userID)      
        .addData("iconURL", URL)
        .addData("msgType", 4)
        .addData("interests", interests)
        .deliveryReceiptRequested(true)
        .build();
                
    global.xcs.sendNoRetry(messageX, to, function (result) {
        if (result.getError()) {
            wlog.info("/livefeedmatch xmpp error: " + result);
            return cb(null,false);
        } else {
            wlog.info("/livefeedmatch message sent: ", result.getMessageId());
            return cb(null, true);
        }
    });
}




function CreateRoomHash(userID, matchedID, callback) {
    var roomhash;
    console.log("MatchedID: " + matchedID);
    console.log("userID: " + userID);
    if(userID > matchedID) {
        roomhash = crypto.createHash('sha512').update(userID).update(matchedID).digest('hex');
        return callback(null, roomhash);
    }
    else {
        roomhash = crypto.createHash('sha512').update(matchedID).update(userID).digest('hex');
        return callback(null, roomhash);
    }
    
}