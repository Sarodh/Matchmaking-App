var express = require('express');
var router = express.Router();
var fs = require('fs');
var crypto = require('crypto');
var cloudinary = require('cloudinary');
var wlog = require('../services/wLogger.js');

cloudinary.config({ 
  cloud_name: 'who', 
  api_key: process.env.CLOUDINARY_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET,
  CLOUDINARY_URL: process.env.CLOUDINARY_URL
});

router.post('/upload', function(req, res) {
    var encodedImage = req.rawBody;
    var Imagebuffer = new Buffer(encodedImage, 'binary');
    
    var moment = crypto.createHash('sha1').update(Date.now().toString()).digest('hex');
    var ImageFile = 'JPEG_' + moment + '.jpg';
    
    fs.writeFile(ImageFile, Imagebuffer,'binary', function(err,written){
        if(err) wlog.error(err);
        else {
            wlog.info("file Succesfully written ");    
            cloudinary.uploader.upload(ImageFile, function (image) {
                if(image !== undefined) {
                    fs.unlink(ImageFile);
                    res.json({link: image.secure_url}).end();
                } else wlog.error("Error uploading to Cloudinary, ", image);
            });
        }
    });
});

module.exports = router;
