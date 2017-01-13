var request = require('request');
var googleIdToken = require('google-id-token');

console.log("Process web_client_id: ", process.env.WEB_CLIENT_ID);

var parser = new googleIdToken({getKeys: 
    function(kid, callback) {
        request({uri: 'https://www.googleapis.com/oauth2/v1/certs'}, function(err, response, body) {
            if(err && response.statusCode !== 200) {
                err = err || "error while retrieving the google certs";
                console.log(err);
                callback(err, {});
            } else {
                var keys = JSON.parse(body);
                callback(null, keys[kid]);
            }
        });
    }
});

var isAuthenticated = function(req, res, next) { 

    // Decode token and check for validity 
    console.log("Authenticating");
    
    parser.decode(req.headers.auth_token, function(err, token) {
        if(err) {
            console.log("error while parsing the google token: " + err);
            res.json({error: "invalid token"}).status(400).end();
        } else if(token.isAuthentic && !token.isExpired) {
            if(process.env.WEB_CLIENT_ID == token.data.aud && process.env.ANDROID_CLIENT_ID == token.data.azp) 
                return next();
        } else 
            res.json({error: "expired token"}).status(400).end();
    });
};

module.exports = {
  isAuthenticated: isAuthenticated
};
