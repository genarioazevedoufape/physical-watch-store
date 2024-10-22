const axios = require('axios');
const logger = require('../utils/logger'); 

const isValidCep = (cep) => /^[0-9]{8}$/.test(cep);

const converterCepCoordenadas = async (cep) => {
    if (!isValidCep(cep)) {
        const errorMsg = 'Formato de CEP inválido. O CEP deve conter 8 dígitos numéricos.';
        logger.errorLogger.error(errorMsg, cep);
    }

    try {
        logger.infoLogger.info('Iniciando busca de coordenadas para o CEP', { cep });

        const response = await axios.get(process.env.DISTANCEMATRIX_BASE_URL, {
            params: {
                address: cep,
                key: process.env.DISTANCEMATRIX_API_KEY,
            },
            timeout: 5000
        });

        // Log da resposta completa
        logger.infoLogger.info('Resposta da API:', { response: response.data });

        if (!response.data.result || response.data.result.length === 0) {
            const errorMsg = 'CEP não encontrado na base de dados geocodificada.';
            logger.errorLogger.error(errorMsg, cep);
        }

        const resultado = response.data.result[0];

        // Verifica se a geometria está presente
        if (!resultado.geometry || !resultado.geometry.location) {
            const errorMsg = 'Coordenadas não encontradas na resposta da API.';
            logger.errorLogger.error(errorMsg, cep);
        }

        const { formatted_address, geometry } = resultado;

        // Acessa latitude e longitude
        const latitude = geometry.location.lat;
        const longitude = geometry.location.lng;

        // Log de latitude e longitude
        logger.infoLogger.info('Coordenadas obtidas com sucesso', {
            cep,
            endereco: formatted_address,
            latitude,
            longitude
        });

        return {
            latitude,
            longitude
        };

    } catch (error) {
        logger.errorLogger.error('Erro ao buscar coordenadas', {
            error: error.message,
            stack: error.stack,
            responseData: error.response ? error.response.data : null
        });
        throw error; 
    }
};

module.exports = { converterCepCoordenadas };
