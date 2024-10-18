const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema({
  nome: String,
  endereco: {
    logradouro: String,
    bairro: String,
    cidade: String,
    estado: String,
    regiao: String,
    localidade: String,
    cep: String,
  },
  coordenadas: {
    latitude: Number,
    longitude: Number,
  },
});


const Store = mongoose.model('Store', StoreSchema);
module.exports = Store;
