const axios = require('axios');

const GOOGLE_MAPS_API_KEY = 'SUA_CHAVE_DE_API_DO_GOOGLE_MAPS'; // Substitua pela sua chave de API
const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

const getCoordenadasByCep = async (cep) => {
    if (!isValidCep(cep)) {
        throw new Error('Formato de CEP inválido. O CEP deve conter 8 dígitos numéricos.');
    }

    try {
        const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}?address=${cep}&key=${GOOGLE_MAPS_API_KEY}`);
        
        if (response.data.status !== 'OK') {
            throw new Error('Não foi possível obter coordenadas para o CEP fornecido.');
        }
        
        const { lat, lng } = response.data.results[0].geometry.location;
        return { latitude: lat, longitude: lng };
        
    } catch (error) {
        console.error(`Erro ao buscar coordenadas para o CEP ${cep}:`, error.message || error);
        throw new Error('Erro ao buscar coordenadas. Verifique o formato ou tente novamente mais tarde.');
    }
};

const isValidCep = (cep) => /^[0-9]{8}$/.test(cep);

module.exports = { getCoordenadasByCep };
