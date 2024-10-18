const Loja = require('../models/Loja');
const { getEnderecoByCep } = require('../services/getEnderecoByCep');
const { calcularDistancia } = require('../utils/calcularDistancia');

module.exports = class LojaController {
 
    // Criar uma nova loja
    static async createLoja(req, res) {
        try {
            const loja = await Loja.create(req.body);
            res.status(201).json(loja);
        } catch (err) {
            res.status(500).json({ message: 'Erro ao criar a loja', error: err });
        }
    }

    // Localizar a loja mais próxima com base no CEP
    static async localizarLoja(req, res) {}
       
};
