const axios = require('axios');
const logger = require('../utils/logger'); // Importar o logger

const isValidCep = (cep) => /^[0-9]{8}$/.test(cep);

const getEnderecoByCep = async (cep) => {
    if (!isValidCep(cep)) {
        const errorMsg = 'Formato de CEP inválido. O CEP deve conter 8 dígitos numéricos.';
        logger.error(errorMsg, { cep }); // Log de erro
        throw new Error(errorMsg);
    }

    try {
        logger.info('Iniciando busca de coordenadas para o CEP', { cep }); // Log de início da requisição

        const response = await axios.get(`${process.env.OPENCAGE_BASE_URL}`, {
            params: {
                q: cep,
                key: process.env.OPENCAGE_API_KEY,
                countrycode: 'br', // Limitar a busca ao Brasil
                pretty: 1,          // Opcional: torna a resposta mais legível
                limit: 1            // Retorna apenas o primeiro resultado
            },
            timeout: 5000
        });

        // Verificando se há resultados válidos
        if (response.data.results.length === 0) {
            const errorMsg = 'CEP não encontrado na base de dados geocodificada.';
            logger.warn(errorMsg, { cep }); // Log de aviso
            throw new Error(errorMsg);
        }

        const resultado = response.data.results[0];
        const { formatted, geometry } = resultado;

        logger.info('Coordenadas obtidas com sucesso', { cep, endereco: formatted, latitude: geometry.lat, longitude: geometry.lng }); // Log de sucesso

        return {
            enderecoCompleto: formatted,
            latitude: geometry.lat,
            longitude: geometry.lng
        };

    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            const errorMsg = 'Erro: Timeout ao tentar conectar com a API do OpenCage.';
            logger.error(errorMsg, { cep, error: error.message }); // Log de erro
            throw new Error('Erro de conexão. O serviço de geocodificação está demorando para responder.');
        } else if (error.response && error.response.status === 403) {
            const errorMsg = 'Erro: A chave da API OpenCage pode estar incorreta ou você atingiu o limite de requisições.';
            logger.error(errorMsg, { cep, error: error.message }); // Log de erro
            throw new Error('Erro de autenticação. Verifique sua chave de API do OpenCage.');
        } else if (error.response && error.response.status === 400) {
            const errorMsg = 'Erro: Solicitação inválida para a API do OpenCage.';
            logger.error(errorMsg, { cep, error: error.message }); // Log de erro
            throw new Error('Erro na solicitação. Verifique se o CEP está correto.');
        } else {
            const errorMsg = `Erro ao buscar coordenadas para o CEP ${cep}.`;
            logger.error(errorMsg, { cep, error: error.message || error }); // Log de erro genérico
            throw new Error('Erro ao buscar coordenadas. Verifique o formato do CEP ou tente novamente mais tarde.');
        }
    }
};

module.exports = { getEnderecoByCep };
