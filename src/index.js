const express = require('express');
const conn = require('./db/conn');
const logger = require('./utils/logger');


const PORT = process.env.PORT 
const lojaRoutes = require('./routes/LojaRoutes');

const app = express();

//Config json response
app.use(express.json());

//Connect to database
conn();

//Routes
app.use('/loja', lojaRoutes);

//Connect to server
app.listen(PORT, () => {
    logger.loggerConn.info(`Servidor rodando na porta ${PORT}`);
    console.log('Servidor rodando na porta 3000');
});

