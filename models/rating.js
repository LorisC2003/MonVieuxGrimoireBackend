const mongoose = require("mongoose");

const ratingSchema = mongoose.Schema({
    userId: { type:  String, ref: 'User', required: true },
    rating: { type: Number, required: true },
});

module.exports = mongoose.model('Rating', ratingSchema);