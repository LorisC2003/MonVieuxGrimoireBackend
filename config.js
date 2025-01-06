const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    port: process.env.PORT,
    hostname: process.env.HOSTNAME,
    mongo: {
        databaseName: process.env.MONGO_DATABASE_NAME,
        url: process.env.MONGO_URL,
    }
}