const Book = require('../models/book');
const Rating = require('../models/rating');
const CompressImages = require('../middleware/compress-images')
const fs = require('fs');


// Crée un nouveau livre avec ses données, ses évaluations associées et une image compressée, puis l'enregistre dans la base de données.
exports.createBook = async (req, res, next) => {
    try {

        const bookData = JSON.parse(req.body.book);
        delete bookData._userId;

        let savedRatings = [];
        if (bookData.ratings && bookData.ratings.length > 0) {
            for (let ratingData of bookData.ratings) {
                const rating = new Rating({userId: ratingData.userId, rating: ratingData.grade});
                const savedRating = await rating.save();
                savedRatings.push(savedRating._id);
            }
        }


        const averageRating = bookData.averageRating || (
            savedRatings.length > 0
                ? savedRatings.reduce((sum, rating) => sum + rating.grade, 0) / savedRatings.length
                : 0
        );


        let filename = CompressImages.compressImages(req);


        const bookItem = new Book({
            ...bookData,
            ratings: savedRatings,
            averageRating: averageRating,
            imageUrl: `${req.protocol}://${req.get('host')}/${filename}`
        });

        await bookItem.save();


        res.status(201).json({ message: 'Book successfully created!' });
    } catch (error) {
        res.status(400).json({ error });
    }
};


// Récupère un livre spécifique dans la base de données en fonction de son ID.
exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then((book) => res.status(200).json(book))
        .catch((error) => res.status(404).json({ error }));
};


// Ajoute une évaluation à un livre donné, met à jour sa note moyenne et renvoie les données du livre.
exports.ratingBook = async (req, res, next) => {
    try {
        const book = await Book.findOne({ _id: req.params.id }).populate('ratings');
        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }


        const reviewerId = req.body.userId;
        let userFound = false;
        book.ratings.forEach((rating) => {
            if (rating.userId === reviewerId) {
                userFound = true
            }
        })
        if (userFound === true) {
            res.status(200).json(book);
            return;
        }

        const rating = new Rating({
            userId: req.body.userId,
            rating: req.body.rating
        });
        await rating.save();
        book.ratings.push(rating._id);


        const ratings = await Rating.find({ _id: { $in: book.ratings } });
        const totalRating = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        book.averageRating = totalRating / ratings.length;

        await book.save();
        res.status(200).json(book);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


// Modifie les informations d'un livre, y compris son image si elle est mise à jour, tout en vérifiant l'autorisation de l'utilisateur.
exports.modifyBook = (req, res, next) => {
    const bookObject = req.file
        ? {
            ...JSON.parse(req.body.book),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        }
        : { ...req.body };

    delete bookObject._userId;

    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {

                if (req.file) {
                    const oldImagePath = book.imageUrl.split('/images/')[1];
                    fs.unlink(`images/${oldImagePath}`, (err) => {
                        if (err) console.error('Erreur lors de la suppression de l\'image:', err);
                    });
                }

                Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                    .then(() => res.status(200).json({ message: 'Objet modifié!' }))
                    .catch((error) => res.status(400).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};


// Supprime un livre et son image associée après vérification de l'autorisation de l'utilisateur.
exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id})
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({message: 'Not authorized'});
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({_id: req.params.id})
                        .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
};


// Récupère tous les livres disponibles dans la base de données.
exports.getAllBooks = (req, res, next) => {
    Book.find().then(
        (books) => {
            res.status(200).json(books);
        }
    ).catch(
        (error) => {
            res.status(400).json({
                error: error
            });
        }
    );
};


// Renvoie les trois livres les mieux notés en fonction de leur note moyenne.
exports.bestRatingBook = (req, res, next) => {
    Book.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .then(
        (books) => {
            res.status(200).json(books);
        }
    ).catch((error) => {
            res.status(400).json({ error: error });
        }
    );
};