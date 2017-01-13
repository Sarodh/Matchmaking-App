// Not used for now 
var Sender = require('node-xcs').Sender;
var Result = require('node-xcs').Result;
var Message = require('node-xcs').Message;
var Notification = require('node-xcs').Notification;
var path = require('path');
var wlog = require('../services/wLogger.js');

var xcs;

var connectXmpp = function () {
    xcs = new Sender(process.env.GoogleID, process.env.WEB_CLIENT_ID);
    
    xcs.on('connected', function() {
        console.log("Sucessfully connected to Google XMPP ccs server");
    });
};


var matchmakingX = function(to, roomID, regId, userID, iconURL, commonInterests, cb) {

     var messageX = new Message("matchmakingX")
        .priority("high")
        .dryRun(false)
        .addData("roomID", roomID)
        .addData("gcmID", regId)
        .addData("userID", userID)        
        .addData("msgType", 1)
        .addData("iconURL", iconURL)
        .addData("commonInterests", commonInterests)
        .deliveryReceiptRequested(true)
        .build();
                
    sendXMPP(to, messageX, function(err, success) {
        if(err) 
            return cb(err);
        else 
            return cb(null, true);
    });
};

var livematchX = function(to, roomID, userID, URL, interests, cb) {

     var messageX = new Message("livematchX")
        .priority("high")
        .dryRun(false)
        .addData("roomID", roomID)
        .addData("userID", userID)      
        .addData("iconURL", URL)
        .addData("msgType", 4)
        .addData("interests", interests)
        .deliveryReceiptRequested(true)
        .build();
        
    sendXMPP(to, messageX, function(err, success) {
        if(err) 
            return cb(err);
        else 
            return cb(null, true);
    });
};

var chatmessageX = function(to, roomID, userID, message, cb) {
    
    var messageX = new Message("chatmessageX")
        .priority("high")
        .dryRun(false)
        .addData("roomID", roomID)
        .addData("userID", userID)
        .addData("message", message)
        .addData("msgType", 2)
        .deliveryReceiptRequested(true)
        .build();
        
    sendXMPP(to, messageX, function(err, success) {
        if(err) 
            return cb(err);
        else 
            return cb(null, true);
    });    
};

var pictureX = function(to, roomID, image_url, cb) {
    
    var messageX = new Message("pictureX")
        .priority("high")
        .dryRun(false)
        .addData("roomID", roomID)
        .addData("iconURL", image_url)
        .addData("msgType", 6)
        .deliveryReceiptRequested(true)
        .build(); 
        
    sendXMPP(to, messageX, function(err, success) {
        if(err) 
            return cb(err);
        else 
            return cb(null, true);
    });    
};

var statusX = function(to, roomID, cb) {
    var messageX = new Message("readStatus")
                        .priority("high")
                        .dryRun(false)
                        .addData("roomID", roomID)
                        .addData("msgType", 5)
                        .deliveryReceiptRequested(true)
                        .build();
                        
    sendXMPP(to, messageX, function(err, success) {
        if(err) 
            return cb(err);
        else 
            return cb(null, true);
    });                            
};

var leaveroomX = function(to, roomID, cb) {
    
    var messageX = new Message("leaveroomX")
        .priority("high")
        .dryRun(false)
        .addData("roomID", roomID)
        .addData("msgType", 3)
        .deliveryReceiptRequested(true)
        .build();
        
    sendXMPP(to, messageX, function(err, success) {
        if(err) 
            return cb(err);
        else 
            return cb(null, true);
    });   
};

function sendXMPP(to, messageX, cb) {
    xcs.sendNoRetry(messageX, to, function (result) {
        if (result.getError()) {
            wlog.error(result);
            return cb(result);
        } else 
            return cb(null, true);
    });
} 


module.exports = {
  matchmakingX: matchmakingX, //,
  livematchX: livematchX,
  leaveroomX: leaveroomX,
  statusX: statusX,
  pictureX: pictureX,
  chatmessageX: chatmessageX, 
  connectXmpp: connectXmpp
  //connectXmpp: connectXmpp()
};