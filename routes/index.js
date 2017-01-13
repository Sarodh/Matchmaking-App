var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.json({ message: 'Documentation is private' }).status(403).end();   
});

module.exports = router;