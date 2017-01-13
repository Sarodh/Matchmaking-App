var express = require('express');
var router = express.Router();
var Users = require('../models/users').model;
var async = require('async');
var wlog = require('../services/wLogger.js');

router.post('/livefeed', function(req, res) {
    console.log("/livefeed request body: ", req.body );

    async.waterfall([
        function(callback) 
        {
            Users.findOneAndUpdate({android_id: req.body.hashedID}, {'location.coordinates': [req.body.coordinates.longitude, req.body.coordinates.latitude]}, function(err, result) {
                if(err) {
                    wlog.error(err);
                    res.status(500).end();
                } else if(result) {
                    callback(null, (result.foundUsers).concat(result.blockedUsers), (req.body.Range*1609.34));
                } else res.json({result: false}).status(200).end();
            });
        },
        function(removedUsers, range, callback) 
        {
            Users.aggregate([
            {   
                $geoNear: {
                near:  
                    { type: "Point", coordinates: [ req.body.coordinates.longitude, req.body.coordinates.latitude ] }, 
                    distanceField: "dist", maxDistance: range, distanceMultiplier: 0.000621371192, spherical: true
                },
            },
            { $match: {android_id: {$nin: removedUsers, $ne: req.body.hashedID}, livefeed: true} },
            { $project: {_id: 0, android_id: 1, dist: 1, interests: 1, icon: 1} }], 
            function(err, result) {
                if(err) { 
                    wlog.error(err);
                } else if(result.length > 0) {
                    wlog.debug("Livefeed query result", result);
                    var rObj = {};
                    var finalResult = result.map(function(i) {
                        rObj = {'id': i.android_id, 'interests': i.interests, 'icon': i.icon};
                        return rObj;
                    });
                    res.json({result: true, users: finalResult}).end(); 
                } else res.json({result: false}).end();
            }); 
        }
    ]);
});

module.exports = router;
