const jwt = require('jsonwebtoken');


// Vérifie l'authenticité du jeton JWT, l'ID utilisateur et l'ajoute à la requête pour autoriser ou refuser l'accès.
module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
        const userId = decodedToken.userId;

        req.auth = {
            userId: userId
        };

        next();
    } catch(error) {
        res.status(401).json({ error });
    }
};