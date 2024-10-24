const mongoose = require('mongoose');
const logger = require('../utils/logger');
require('dotenv').config();

// Conectando o Mongoose ao banco de dados MongoDB
async function conn() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.loggerConn.info('Conectado ao banco de dados com sucesso'); 
        console.log('Conectado ao banco de dados com sucesso');

    } catch (err) {
        console.error('Erro ao conectar-se ao banco de dados', err);
        logger.loggerConn.error('Erro ao conectar-se ao banco de dados', { error: err.message });
    }
}

module.exports = conn;