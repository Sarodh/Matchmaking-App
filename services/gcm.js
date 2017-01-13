var request = require('request');

var SendGCM = function (gcmId, message, callback) {
    
    //if(message.msgType == "matchfound") {
        var body = JSON.stringify({
        to: gcmId,
        priority: "high",
        data : {
            message, title: "Who?",
        },
        })
    //}
    var options = 
    { 
        method: 'POST',
        uri: 'https://android.googleapis.com/gcm/send',
        headers: {
            'Content-Type': 'application/json',
            'Authorization':'key=' + process.env.WEB_CLIENT_ID
            
        },
        body: body
    }
    request(options, function (error, response, body) {
        if(error) {
            console.log(error)
            return callback(error);
        }
        else 
            return callback(response); 
        
        });
}

module.exports = {
  SendGCM: SendGCM
}