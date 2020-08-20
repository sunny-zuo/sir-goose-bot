const MongoClient = require("mongodb").MongoClient;

const mongoClient = new MongoClient(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

let _db;

async function connectDB() {
    return new Promise((resolve, reject) => {
        mongoClient.connect((err, client) => {
            if (err) {
                reject({ success: false, err: err });
            }
            _db = client.db("database");
            resolve({ success: true });
        });
    });
}

function getDB() {
    return _db;
}

module.exports = { connectDB, getDB }