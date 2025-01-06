const path = require('path');
const sharp = require('sharp');
const fs = require("fs");


// Compression de l'image téléchargée, convertit en format WebP avec une qualité réduite
exports.compressImages = (req) => {
    if (req.file) {

        const fileNameWithoutExt = req.file.originalname.split('.').slice(0, -1).join('.');
        const finalName = 'images/' + fileNameWithoutExt + Date.now() + '.webp'
        sharp(req.file.path)
            .resize({ height: 1080 })
            .toFormat('webp')
            .webp({ quality: 80 })
            .toFile(finalName, (err, info) => {
                if (err) {
                    return res.status(400).json({ error: 'Erreur lors de la compression de l\'image.' });
                }

                fs.unlink(req.file.path, () => {
                    req.file.path = finalName;
                });
            });


        return finalName;
    }
};
