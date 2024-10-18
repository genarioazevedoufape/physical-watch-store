const mongoose = require('mongoose');
const { Schema } = mongoose;

const Store = mongoose.model(
    'Store',
    new Schema({
        nome: {
            type: String,
            required: true
        },
        endereco: {
            logradouro: {
                type: String,
                required: true
            },
            bairro: {
                type: String,
                required: true
            },
            cidade: {
                type: String,
                required: true
            },
            estado: {
                type: String,
                required: true
            },
            cep: {
                type: String,
                required: true
            },
        },
        coordenadas: {
            latitude: {
                type: Number,
                required: true
            },
            longitude: {
                type: Number,
                required: true
            },
        },
    }, { timestamps: true })
);
module.exports = Store;
