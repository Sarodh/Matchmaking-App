var express = require('express');
var router = express.Router();
var Chatrooms = require('../models/chatrooms').model;
var Users = require('../models/users').model;
var Message = require('node-xcs').Message;
var async = require('async');
var wlog = require('../services/wLogger.js');


router.post('/leaveroom', function(req, res) {
    wlog.debug("/leaveroom request body: ", req.body);

    async.parallel([
        function(callback) 
        {
            Chatrooms.findOneAndRemove({_id: req.body.roomID},function(err, found) {
                if(err) {
                    wlog.err(err);
                    callback("Error");
                } else 
                    callback(null, true);
            });
        },
        function(callback) 
        {
            Users.findOneAndUpdate({android_id: req.body.hashedID},{$pullAll: {'rooms': [req.body.roomID], 'foundUsers': [req.body.userID]}}, function(err, result) {
                if(err) {
                    wlog.err(err);
                    callback("Error");
                } else if(result)
                    callback(null, result.registrationId);
            });
        },
        function(callback) 
        {
            Users.findOneAndUpdate({android_id: req.body.userID},{$pullAll: {'rooms': [req.body.roomID], 'foundUsers': [req.body.hashedID]}}, function(err, result) {
                if(err) {
                    wlog.err(err);
                    callback("Error");
                } else {
                    if(result.registrationId == null || result.registrationId == "undefined")  {
                        console.log("/leaveroom null registrationId");
                    } else 
                        callback(null, result.registrationId);
                }
            });    
        }], function(err, final) 
        {
            if(err) {
                wlog.err(err);
            } else {
                sendX(final[2], req.body.roomID, function(err, returned) {
                    if(err) {
                        wlog.err(err);
                    } else {
                        wlog.info("/leaveroom XMPP sent: " + returned);
                        res.json({result: true}).end();
                    }
                });
            }
        });
});

module.exports = router;

function sendX(to, roomID, cb) {
    
     var messageX = new Message(roomID)
        .priority("high")
        .dryRun(false)
        .addData("roomID", roomID)
        .addData("msgType", 3)
        .deliveryReceiptRequested(true)
        .build();
                
    global.xcs.sendNoRetry(messageX, to, function (result) {
        if (result.getError()) {
            console.log(result);
            return cb(null,false);
        } else {
            console.log("message sent: #", result.getMessageId());
            return cb(null, true);
        }
    });
}