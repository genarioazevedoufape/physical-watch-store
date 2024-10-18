const axios = require('axios');

const getEnderecoByCep = async (cep) => {
    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        throw new Error('Erro ao buscar CEP');
    }
};

module.exports = { getEnderecoByCep };
