const axios = require('axios');

const isValidCep = (cep) => /^[0-9]{8}$/.test(cep);

const getEnderecoByCep = async (cep) => {
    if (!isValidCep(cep)) {
        throw new Error('Formato de CEP inválido. O CEP deve conter 8 dígitos numéricos.');
    }

    try {
        const response = await axios.get(`${process.env.OPENCAGE_BASE_URL}`, {
            params: {
                q: cep,
                key: process.env.OPENCAGE_API_KEY,
                countrycode: 'br', // Limitar a busca ao Brasil
                pretty: 1, // Opcional: torna a resposta mais legível
                limit: 1  // Retorna apenas o primeiro resultado
            },
            timeout: 5000
        });
        
        // Verificando se há resultados válidos
        if (response.data.results.length === 0) {
            throw new Error('CEP não encontrado na base de dados geocodificada.');
        }

        const resultado = response.data.results[0];
        const { formatted, geometry } = resultado;

        return {
            enderecoCompleto: formatted,
            latitude: geometry.lat,
            longitude: geometry.lng
        };

    } catch (error) {
        if (error.code === 'ECONNABORTED') {
            console.error('Erro: Timeout ao tentar conectar com a API do OpenCage.');
            throw new Error('Erro de conexão. O serviço de geocodificação está demorando para responder.');
        } else if (error.response && error.response.status === 403) {
            console.error('Erro: A chave da API OpenCage pode estar incorreta ou você atingiu o limite de requisições.');
            throw new Error('Erro de autenticação. Verifique sua chave de API do OpenCage.');
        } else if (error.response && error.response.status === 400) {
            console.error('Erro: Solicitação inválida para a API do OpenCage.');
            throw new Error('Erro na solicitação. Verifique se o CEP está correto.');
        } else {
            console.error(`Erro ao buscar coordenadas para o CEP ${cep}:`, error.message || error);
            throw new Error('Erro ao buscar coordenadas. Verifique o formato do CEP ou tente novamente mais tarde.');
        }
    }
};

module.exports = { getEnderecoByCep };
