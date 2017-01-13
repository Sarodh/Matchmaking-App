var express = require('express');
var router = express.Router();
var Chatrooms = require('../models/chatrooms').model;
var Users = require('../models/users').model;
var crypto = require('crypto');
var wlog = require('../services/wLogger.js');
var async = require('async');
var ccs = require('../services/gcmXmpp.js');

router.post('/initial', function(req,res) {
    
    var hashID = crypto.createHash('sha512').update(req.body.id).digest('hex');

    Users.findOneAndUpdate({android_id: hashID}, {$setOnInsert: {android_id: hashID}}, {passRawResult: true, upsert: true, new: true},function(err, result, raw) {
        if(err) {
            wlog.error(err); 
            res.status(500).end();
        } else if (!raw.lastErrorObject.updatedExisting) {
            // New user Created
            res.json({id: hashID}).end();
        } else if(raw.lastErrorObject.updatedExisting) { 
            res.json({id: hashID}).end();
            // If the user deleted cache, leave all existing rooms. 
            /*
            async.parallel([
                function(callback) {
                    Users.find({android_id: {$in: result.foundUsers}})
                    .populate({path: 'rooms', match: { ids: req.body.id}})
                    .exec(function(err, result) {
                        
                        if(err) console.log(err);
                        else {
                            console.log("Initial request: ", result);
                        }
                        //for(var i in results) {
                        //    ccs.leaveroomX(i.registrationId, ) {
                        //        
                        //    } 
                        //}
                        });
                    
                },
            function(prev, callback) {
                    
            }]);
            
            /*
            Users.find({android_id: {$in: result.foundUsers}}, 'registrationId', function(err, success) {
                if(err) wlog.err(err);
                else if (success) {
                    Chatrooms.remove({Roomname: {$in: result.rooms}}, function(err, success) {
                        if(err) {
                            wlog.err(err);
                            res.status(500).end();
                        } else res.json({status: true});
                    });
                }
            });
            */
        }
    }); 
    
});

module.exports = router;