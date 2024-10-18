const express = require('express');
const conn = require('./db/conn')

const app = express();

//Config json response
app.use(express.json());

conn();

//Routes
app.listen(3000, () => {
    console.log('Server is Servidor online port 3000');
});


