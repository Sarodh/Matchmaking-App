var express = require('express');
var router = express.Router();
var Users = require('../models/users').model;
var Interests = require('../models/interests').model;
var async = require('async');
var crypto = require('crypto');
var wlog = require('../services/wLogger.js');


// Validate and update user info
router.post('/update', function(request, response) {

    wlog.debug("/update request body: ", request.body);
    
    var regId = request.body.regid;
    var interestArray = request.body.array;
    var hashID = crypto.createHash('sha512').update(request.body.id).digest('hex');
    var locObject = request.body.location;
    var update = {
            registrationId: regId, 
            interests: interestArray, 
            icon: request.body.iconURL 
    };
    
    async.waterfall([
        function(callback) {
            if(interestArray == null || interestArray.length == 0) {
                callback(null, []);
            } 
            else {    
                Interests.update({_id: {$in: interestArray}}, {upsert: true}, function (err, result) {
                    if(err) {
                        wlog.error(err);
                        response.status(500).end();
                    }
                    else if(result) 
                        callback(null, interestArray);
                });
            }
        }, 
        function(interests, callback) {
            if(locObject == undefined) {
                console.log("Invalid location");
                callback(null, update);
            } else {
                update.location = {
                    country: locObject.country, 
                    state: locObject.state, 
                    coordinates: [locObject.coordinates.longitude, locObject.coordinates.latitude]
                };
                callback(null, update);
            }
        },
        function(update, callback) {
            console.log("Update: ", update);
            Users.findOneAndUpdate( 
                {android_id: hashID}, 
                update, {upsert: true}, function (err, doc) {
                if(err) {
                    wlog.error(err);
                    response.status(500).end();
                }
                else {
                    wlog.verbose("Updated hashID: " + hashID);
                    response.json({result: hashID}).end();
                    //response.status(200).end();
                }
            });
        }
    ]); 
});

module.exports = router;
