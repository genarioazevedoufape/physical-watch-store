const Loja = require('../models/Loja');

const { getEnderecoByCep } = require('../services/getEnderecoByCep');
const { calcularDistancia } = require('../utils/calcularDistancia');

const logger = require('../utils/logger'); 

module.exports = class LojaController {

   // Criar uma nova loja
   static async createLoja(req, res) {
    try {
        const { nome, endereco } = req.body;

        // Validação individual do campo "nome"
        if (!nome) {
            logger.warn('Nome inválido ao tentar criar uma loja', { nome }); // Log de aviso
            return res.status(400).json({ message: 'O campo "nome" é obrigatório.' });
        }

        // Validação individual do campo "logradouro"
        if (!endereco || !endereco.logradouro) {
            logger.warn('Logradouro inválido ao tentar criar uma loja', { logradouro: endereco?.logradouro }); // Log de aviso
            return res.status(400).json({ message: 'O campo "logradouro" é obrigatório.' });
        }

        // Validação individual do campo "bairro"
        if (!endereco.bairro) {
            logger.warn('Bairro inválido ao tentar criar uma loja', { bairro: endereco?.bairro }); // Log de aviso
            return res.status(400).json({ message: 'O campo "bairro" é obrigatório.' });
        }

        // Validação individual do campo "cidade"
        if (!endereco.cidade) {
            logger.warn('Cidade inválida ao tentar criar uma loja', { cidade: endereco?.cidade }); // Log de aviso
            return res.status(400).json({ message: 'O campo "cidade" é obrigatório.' });
        }

        // Validação individual do campo "estado"
        if (!endereco.estado) {
            logger.warn('Estado inválido ao tentar criar uma loja', { estado: endereco?.estado }); // Log de aviso
            return res.status(400).json({ message: 'O campo "estado" é obrigatório de 2 caracteres.' });
        }

        // Validação individual do campo "cep"
        const isValidCep = (cep) => /^[0-9]{8}$/.test(cep);
        if (!endereco.cep || !isValidCep(endereco.cep)) {
            logger.warn('CEP inválido ao tentar criar uma loja', { cep: endereco?.cep }); // Log de aviso
            return res.status(400).json({ message: 'O campo "cep" é obrigatório e deve ser um CEP válido de 8 dígitos.' });
        }

        // Criação da loja
        const loja = await Loja.create(req.body);
        logger.info('Loja criada com sucesso', { loja }); // Log de sucesso
        res.status(201).json(loja);

    } catch (err) {
        logger.error('Erro ao criar a loja', { error: err.message }); // Log de erro
        res.status(500).json({ message: 'Erro ao criar a loja', error: err.message });
    }
}
    // Localizar a loja mais próxima com base no CEP
    static async localizarLoja(req, res) {
        try {
            const { cep } = req.params;

            logger.info('Iniciando busca de loja mais próxima', { cep }); // Log de início de busca

            // Buscar coordenadas pelo CEP do usuário
            const coordenadasUsuario = await getEnderecoByCep(cep);

            // Obter todas as lojas cadastradas no banco de dados
            const lojas = await Loja.find();

            if (lojas.length === 0) {
                logger.warn('Nenhuma loja cadastrada.'); // Log de aviso
                return res.status(404).json({ message: 'Nenhuma loja cadastrada.' });
            }

            let lojaMaisProxima = null;
            let menorDistancia = Infinity;

            // Criar um array de promessas para buscar as coordenadas de cada loja
            const promessasCoordenadas = lojas.map(async (loja) => {
                try {
                    const coordenadasLoja = await getEnderecoByCep(loja.endereco.cep);
                    const distancia = calcularDistancia(coordenadasUsuario, coordenadasLoja);

                    // Se a distância for menor que 100 km e menor que a distância anterior
                    if (distancia <= 100 && distancia < menorDistancia) {
                        menorDistancia = distancia;
                        lojaMaisProxima = loja;
                    }
                } catch (error) {
                    logger.warn(`Erro ao buscar coordenadas para a loja: ${loja.nome}.`, { error: error.message }); // Log de erro específico
                }
            });

            // Aguardar todas as promessas de coordenadas
            await Promise.all(promessasCoordenadas);

            // Se não encontrar nenhuma loja dentro do raio de 100 km
            if (!lojaMaisProxima) {
                logger.info('Nenhuma loja encontrada dentro de um raio de 100 km.', { cep }); // Log de informação
                return res.status(404).json({ message: 'Nenhuma loja encontrada dentro de um raio de 100 km.' });
            }

            logger.info('Loja mais próxima encontrada', {
                loja: lojaMaisProxima.nome,
                distancia: `${menorDistancia.toFixed(2)} km`,
            }); // Log de sucesso

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
            logger.error('Erro ao localizar loja', { error: error.message || error }); // Log de erro
            res.status(500).json({ message: 'Erro ao localizar loja', error: error.message });
        }
    }    
};
