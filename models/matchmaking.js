var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MatchmakingSchema = Schema (
{
    android_id: String,
    country: String,
    state: String,
    coordinates: {type: [Number], index: '2dsphere'},
});

var Matchmaking = mongoose.model('Matchmaking', MatchmakingSchema);
module.exports = {
  model: Matchmaking
};