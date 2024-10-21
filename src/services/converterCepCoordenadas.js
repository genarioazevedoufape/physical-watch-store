const axios = require('axios');
const logger = require('../utils/logger'); 

const isValidCep = (cep) => /^[0-9]{8}$/.test(cep);

const converterCepCoordenadas = async (cep) => {
    if (!isValidCep(cep)) {
        const errorMsg = 'Formato de CEP inválido. O CEP deve conter 8 dígitos numéricos.';
        logger.errorLogger.error(errorMsg, { cep }); 
        throw new Error(errorMsg);
    }

    try {
        logger.infoLogger.info('Iniciando busca de coordenadas para o CEP', { cep }); 

        const response = await axios.get(`${process.env.OPENCAGE_BASE_URL}`, {
            params: {
                q: cep,
                key: process.env.OPENCAGE_API_KEY,
                countrycode: 'br', 
                pretty: 1,         
                limit: 1            
            },
            timeout: 5000
        });

        // Verificando se há resultados válidos
        if (response.data.results.length === 0) {
            const errorMsg = 'CEP não encontrado na base de dados geocodificada.';
            logger.warnLogger.warn(errorMsg, { cep }); 
            throw new Error(errorMsg);
        }

        const resultado = response.data.results[0];
        const { formatted, geometry } = resultado;

        logger.infoLogger.info('Coordenadas obtidas com sucesso', { cep, endereco: formatted, latitude: geometry.lat, longitude: geometry.lng }); // Log de sucesso

        return {
            enderecoCompleto: formatted,
            latitude: geometry.lat,
            longitude: geometry.lng
        };

    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            const errorMsg = 'Erro: Timeout ao tentar conectar com a API do OpenCage.';
            logger.errorLogger.error(errorMsg, { cep, error: error.message }); 
            throw new Error('Erro de conexão. O serviço de geocodificação está demorando para responder.');
        } else if (error.response && error.response.status === 403) {
            const errorMsg = 'Erro: A chave da API OpenCage pode estar incorreta ou você atingiu o limite de requisições.';
            logger.errorLogger.error(errorMsg, { cep, error: error.message }); 
            throw new Error('Erro de autenticação. Verifique sua chave de API do OpenCage.');
        } else if (error.response && error.response.status === 400) {
            const errorMsg = 'Erro: Solicitação inválida para a API do OpenCage.';
            logger.errorLogger.error(errorMsg, { cep, error: error.message }); 
            throw new Error('Erro na solicitação. Verifique se o CEP está correto.');
        } else {
            const errorMsg = `Erro ao buscar coordenadas para o CEP ${cep}.`;
            logger.errorLogger.error(errorMsg, { cep, error: error.message || error }); 
            throw new Error('Erro ao buscar coordenadas. Verifique o formato do CEP ou tente novamente mais tarde.');
        }
    }
};

module.exports = { converterCepCoordenadas };
