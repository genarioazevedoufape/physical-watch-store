const express = require('express');
const conn = require('./db/conn')

const StoreRoutes = require('./routes/StoreRoutes');

const app = express();

//Config json response
app.use(express.json());

//Connect to database
conn();

//Routes
app.use('/store', StoreRoutes);

//Connect to server
app.listen(3000, () => {
    console.log('Server is Servidor online port 3000');
});


