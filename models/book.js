const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    year: { type: String, required: true },
    genre: { type: String, required: true },
    imageUrl: { type: String, required: true },
    userId: { type: String, ref: 'User', required: true },
    ratings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Rating' }],
    averageRating: { type: Number, required: false },
});

module.exports = mongoose.model('Book', bookSchema);
