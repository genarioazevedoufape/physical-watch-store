const mongoose = require('mongoose');
require('dotenv').config();

async function conn() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Database connected');

    } catch (err) {
        console.error('Error connecting to database', err);
    }
}

module.exports = conn;