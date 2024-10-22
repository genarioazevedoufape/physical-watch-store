const axios = require('axios');

const buscarEnderecoCep = async (cep) => {
    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
        if (response.data.erro) {
            return null; 
        }
        return response.data;
    } catch (error) {
        throw new Error('Erro ao buscar o endereço no ViaCEP');
    }
};

module.exports = { buscarEnderecoCep };
