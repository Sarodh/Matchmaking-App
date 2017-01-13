var express = require('express');
var router = express.Router();
var Users = require('../models/users').model;

router.post('/blockuser', function(req, res) {
    
    Users.update({android_id: req.body.hashedID},{$push: {blockedUsers: req.body.userID} } ,function(err, success) {
        if(err) res.status(500).end();
        else if(success) {
            Users.update({android_id: req.body.userID}, {$push: {blockedUsers: req.body.hashedID}},function(err, success) {
                if(err) res.status(500).end();
                else res.json({result: true}).end();      
            });
        }
    });
});


module.exports = router;
