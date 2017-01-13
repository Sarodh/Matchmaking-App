var express = require('express');
var router = express.Router();
var Users = require('../models/users').model;
var Chatrooms = require('../models/chatrooms').model;
var Matchmaking = require('../models/matchmaking').model;
var wlog = require('../services/wLogger.js');
var async = require('async');
var crypto = require('crypto');
var Message = require('node-xcs').Message;


router.post('/findmatch', function(request, response) { 
    //var body = JSON.parse(request.body.params);
    wlog.debug("/findmatch request body: %j", request.body);
    var userID = request.body.id;

    async.waterfall([
        // Retrieve user's interests, coordinates, and current chat partner Ids  
        function(callback) {
            Users.findOneAndUpdate({android_id: userID}, {$set: {status: true}}, function (err, person) {
                if(err) {
                    wlog.error(err);
                    response.status(500).end();
                }
                else if(person) {
                  return callback(null, person.interests, person.location, (person.foundUsers).concat(person.blockedUsers), person.registrationId, person.icon);
                } else {
                    wlog.info("Hashed ID not found ");
                    response.status(400).end();
                }
            }); 
        },
        function(interests, locObject, unmatch, regId, userURL,callback) {
            Matchmaking.aggregate([
                {   
                    $geoNear: {
                        near:  
                        { type: "Point", coordinates: [ locObject.coordinates[0],  locObject.coordinates[1] ] }, 
                        distanceField: "distance", maxDistance: 24140.2, distanceMultiplier: 0.000621371192, spherical: true,
                        query: {$and: [{android_id: {$ne: userID}}, {android_id: {$nin: unmatch}}]}
                    },
                },
                { $project: {_id: 0, android_id: 1, distance: 1} }], 
            function(err, results) {
                if(err) {
                    wlog.error(err);
                    response.status(500).end();
                } else if(results == 0) {
                    wlog.info("No users in city/state. User inserted to MM coll.");
                    search(userID, locObject, function(err, success) {
                        if(err) {
                            wlog.error(err);
                            response.status(500).end();  
                        } else response.json({ matchFound: false }).end();
                    });
                } else return callback(null, interests, results, regId, userURL, locObject); 
            });
        },
        function(ids,loc, regId, userURL, locObject,  callback) {
            matchInterests(loc, ids, userID, function(err, users) {
                if(err) {
                    wlog.error(err);
                    response.status(500).end();
                } else if(users.length == 0 || users == 0) {
                    wlog.info("No match found, inserted to matchmaking collection");
                    search(userID, locObject, function(err, success) {
                        if(err) {
                            wlog.error(err);
                            response.status(500).end();  
                        } else response.json({matchFound: false}).end();
                    });
                } else return callback(null, users[0], regId, userURL);
            });
        },
        function(users, regId, userURL, callback) {
            var matchedRoom  = {
                  roomhash: CreateRoomHash(userID, users.android_id),
                  id: users.android_id,
                  regid: users.registrationId, 
                  mURL: users.icon,
                  commonInterests: users.commonInterests
            };
            wlog.info("Matched Room: : " , matchedRoom);
            callback(null,matchedRoom, regId, userURL); 
        },
        function(matchedRoom, regId, userURL, callback) {
            async.parallel([
                function(callback) {
                    Chatrooms.create({_id: matchedRoom.roomhash, userNum: 2, status: false, ids: [userID, matchedRoom.id]}, function (err, worked) { 
                        if(err) {
                            wlog.info(err);
                            response.status(500).end();
                        } else callback(null, true);
                    });
                },
                function(callback) {
                    Users.update({android_id: userID},{$addToSet: {rooms: matchedRoom.roomhash, foundUsers: matchedRoom.id}, status: false}, function(err, success) {
                        if(err) {
                            wlog.error(err);
                            callback("error");
                        } else if(success) callback(null, true);
                    });
                },
                function(callback) {
                    Users.update({android_id: matchedRoom.id},{$addToSet: {rooms: matchedRoom.roomhash, foundUsers: userID}, status: false}, function(err, success) {
                        if(err) {
                            wlog.error(err);
                            callback("error");
                        } else if(success) callback(null, true);
                    });
                }], function(err, result) {
                    if(err) {
                        wlog.info("findmatch async.parallel result: " , result);
                        response.status(500).end();
                    } else if(result) {
                        Matchmaking.remove({android_id: {$in: [userID, matchedRoom.id]}}, function(err, result) {
                            if(err) response.status(500).end();
                            else if(result) {
                                sendX(matchedRoom.regid, matchedRoom.roomhash, regId, userID, userURL, matchedRoom.commonInterests, function(err, res) {
                                    if(err) {
                                        wlog.error(err);
                                        return callback("error");
                                    } else if(res) {
                                        response.json({"roomID": matchedRoom.roomhash, 
                                                "gcmID": matchedRoom.regid, 
                                                "userID": matchedRoom.id,
                                                "msgType": 1,
                                                "iconURL": matchedRoom.mURL,
                                                "matchFound":true,
                                                "commonInterests": matchedRoom.commonInterests
                                        }).end();
                                    }
                                }); 
                            } 
                        });
                    }
                });
        }], function(err, result) {
        if(err) {
            wlog.error(err);
            response.status(500).end();
        } else wlog.info("Matchmaking Async result: " + result);
    });
});

//XMPP message forwarding to matched clients
function sendX(to, roomID, regId, userID, iconURL, commonInterests, cb) {
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
                
    global.xcs.sendNoRetry(messageX, to, function (result) {
        if (result.getError()) {
            wlog.error(result);
            return cb(null,false);
        } else {
            wlog.info("/findmatch xmpp sent succesfully: ", result.getMessageId());
            return cb(null, true);
        }
    });
}

// Match interests 
function matchInterests(Ids, interests, userID, callback) {
    var result = Ids.map(function( obj ) {
        return obj.android_id;
    });
    Users.aggregate(
        [
            { $match: {
                    android_id: {$in: result}, 
                    interests: {$in: interests}}},
            { $project: {
                    registrationId: 1,
                    android_id: 1, 
                    interests: 1, 
                    icon: 1,
                    'commonInterests': {$setIntersection: ['$interests', interests]},    
                    common: 
                        {$size: 
                            { 
                                $setIntersection: ['$interests', interests]
                            }   
                        }
            }},
            { $sort: {common: -1 }},
            { $limit: 1 }
        ], 
        function(err, user) {
            if(err) { 
                wlog.error(err);
                return callback("Error");
            } else if(user.length > 0) {
                return callback(null,user);
            } else return callback(null, 0);
    });
}

function CreateRoomHash(userID, matchedID) {
    var roomhash;
    if(userID > matchedID) {
        roomhash = crypto.createHash('sha512').update(userID).update(matchedID).digest('hex');
        return roomhash;
    }
    else {
        roomhash = crypto.createHash('sha512').update(matchedID).update(userID).digest('hex');
        return roomhash;
    }
}
// Insert user in to matchmaking collection 
function search(userID, locationObject, callback) {
            var newSearch = {
                android_id: userID,
                country: locationObject.country,
                state: locationObject.state,
                coordinates: [
                    locationObject.coordinates[0],
                    locationObject.coordinates[1]
                ]
            };    
            Matchmaking.create(newSearch, function(err, result) {
                if(err) wlog.error(err); 
                else return callback(null, true);
                
            });
}
module.exports = router;
