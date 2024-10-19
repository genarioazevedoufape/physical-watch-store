const Loja = require('../models/Loja');
const { getCoordenadasByCep } = require('../services/getCoordenadasByCep');
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
    static async localizarLoja(req, res) {
        try {
            const { cep } = req.params;
    
            // Buscar coordenadas pelo CEP informado
            const coordenadasUsuario = await getCoordenadasByCep(cep);
            
            // Obter todas as lojas cadastradas no banco de dados
            const lojas = await Loja.find();
            
            // Se não houver lojas cadastradas
            if (lojas.length === 0) {
                return res.status(404).json({ message: 'Nenhuma loja cadastrada.' });
            }
    
            let lojaMaisProxima = null;
            let menorDistancia = Infinity;
    
            // Percorrer todas as lojas e calcular a distância entre o usuário e a loja
            for (const loja of lojas) {
                const coordenadasLoja = {
                    latitude: parseFloat(loja.latitude), // As coordenadas da loja devem estar armazenadas no banco
                    longitude: parseFloat(loja.longitude),
                };
                const distancia = calcularDistancia(coordenadasUsuario, coordenadasLoja);
                
                // Se a distância for menor que 100km e menor que a distância anterior
                if (distancia <= 100 && distancia < menorDistancia) {
                    menorDistancia = distancia;
                    lojaMaisProxima = loja;
                }
            }
    
            // Se não encontrar nenhuma loja dentro do raio de 100km
            if (!lojaMaisProxima) {
                return res.status(404).json({ message: 'Nenhuma loja encontrada dentro de um raio de 100km.' });
            }
    
            // Retornar a loja mais próxima com as informações necessárias
            res.status(200).json({
                loja: lojaMaisProxima,
                distancia: menorDistancia.toFixed(2) + ' km',
            });
    
        } catch (error) {
            console.error(`Erro ao localizar loja: ${error.message || error}`);
            res.status(500).json({ message: 'Erro ao localizar loja', error: error.message });
        }
    }
    
       
};
