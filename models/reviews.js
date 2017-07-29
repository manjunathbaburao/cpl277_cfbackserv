/**
 * Schema to store reviews in MongoDB
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var reviews = new Schema({
	restaurantName: {type: String, required: true},
	userName : {type: String, required: true, maxSize: 200},
	userEmail : {type: String, required: true, maxSize: 200},
	review: {type: String, maxSize: 10 * 1024},
	rating: {type: String, enum: ['1', '2', '3', '4', '5'], required: true}
});

reviews.index({restaurantId: 1, key: 1});

module.exports = mongoose.model('reviews', reviews);