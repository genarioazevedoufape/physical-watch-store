const mongoose = require('mongoose');
const { Schema } = mongoose;

const Loja = mongoose.model(
    'Loja',
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
            numero: {
                type: String,
                required: true
            },
            cep: {
                type: String,
                required: true
            },
        },
    }, { timestamps: true })
);
module.exports = Loja;
