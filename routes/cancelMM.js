var express = require('express');
var router = express.Router();
var Matchmaking = require('../models/matchmaking').model;
var Users = require('../models/users').model;

router.post('/cancelMM', function(req, res) {
    
    Matchmaking.remove({android_id: req.body.id}, function(err, removed) {
      if(err) res.status(500).end();
      else if(removed) {
        Users.update({android_id: req.body.id}, {status: false}, function(err, updated) {
            if(err) res.status(500).end();
            else if(updated) {
                res.json({result: true}).end();      
            }
        });
        }  
    }); 
});


module.exports = router;
