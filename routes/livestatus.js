var express = require('express');
var router = express.Router();
var Users = require('../models/users').model;
var wlog = require('../services/wLogger.js');

router.post('/livestatus', function(req, res) {
    Users.update({android_id: req.body.userID}, {livefeed: req.body.status}, function(err, result) {
        if(err) {
            wlog.err(err);
            res.status(500).end();
        } else if(result) {
            res.json({result: true}).end();
        } else res.json({result: false}).end();
    }); 
});

module.exports = router;