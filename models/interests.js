var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var InterestSchema = Schema (
{
    _id: { type: String, unique : true} 
    //interestId: {
    //    type: Number, 
    //    default: 0
    //},
    //count: Number,
});

var Interests = mongoose.model('Interests', InterestSchema);
module.exports = {
  model: Interests
};