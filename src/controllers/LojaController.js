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
    static async localizarLoja(req, res) {
        try {
            const { cep } = req.params;
    
            // Buscar coordenadas pelo CEP do usuário
            const coordenadasUsuario = await getEnderecoByCep(cep);
            console.log("Coordenadas do usuário:", coordenadasUsuario); // Log das coordenadas do usuário
    
            // Obter todas as lojas cadastradas no banco de dados
            const lojas = await Loja.find();
    
            // Se não houver lojas cadastradas
            if (lojas.length === 0) {
                return res.status(404).json({ message: 'Nenhuma loja cadastrada.' });
            }
    
            let lojaMaisProxima = null;
            let menorDistancia = Infinity;
    
            // Criar um array de promessas para buscar as coordenadas de cada loja
            const promessasCoordenadas = lojas.map(async (loja) => {
                try {
                    const coordenadasLoja = await getEnderecoByCep(loja.endereco.cep);
                    console.log(`Coordenadas da loja ${loja.nome}:`, coordenadasLoja); // Log das coordenadas da loja
    
                    const distancia = calcularDistancia(coordenadasUsuario, coordenadasLoja);
                    console.log(`Distância entre usuário e loja ${loja.nome}:`, distancia); // Log da distância
    
                    // Se a distância for menor que 100 km e menor que a distância anterior
                    if (distancia <= 100 && distancia < menorDistancia) {
                        menorDistancia = distancia;
                        lojaMaisProxima = loja;
                    }
                } catch (error) {
                    console.warn(`Erro ao buscar coordenadas para a loja: ${loja.nome}. Detalhes: ${error.message}`);
                }
            });
    
            // Aguardar todas as promessas de coordenadas
            await Promise.all(promessasCoordenadas);
    
            // Se não encontrar nenhuma loja dentro do raio de 100 km
            if (!lojaMaisProxima) {
                return res.status(404).json({ message: 'Nenhuma loja encontrada dentro de um raio de 100 km.' });
            }
    
            // Retornar a loja mais próxima com as informações necessárias
            res.status(200).json({
                loja: {
                    nome: lojaMaisProxima.nome,
                    endereco: lojaMaisProxima.endereco,
                    distancia: `${menorDistancia.toFixed(2)} km`,
                    coordenadas: {
                        latitude: coordenadasUsuario.latitude,
                        longitude: coordenadasUsuario.longitude,
                    },
                },
            });
    
        } catch (error) {
            console.error(`Erro ao localizar loja: ${error.message || error}`);
            res.status(500).json({ message: 'Erro ao localizar loja', error: error.message });
        }
    }    
};    