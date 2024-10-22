const Loja = require('../models/Loja');

const { converterCepCoordenadas } = require('../services/converterCEP');
const { calcularDistancia } = require('../utils/calcularDistancia');
const { buscarEnderecoCep } = require('../services/buscarEnderecoCep');

const logger = require('../utils/logger');

module.exports = class LojaController {

    // Criar uma nova loja
    static async createLoja(req, res) {
        try {
            const { nome, endereco } = req.body;

            // Validação do campo "nome"
            if (!nome) {
                logger.warnLogger.warn('Nome inválido ao tentar criar uma loja', { nome });
                return res.status(400).json({ message: 'O campo "nome" é obrigatório.' });
            }

            // Validação do campo "cep"
            const isValidCep = (cep) => /^[0-9]{8}$/.test(cep);
            if (!endereco || !endereco.cep || !isValidCep(endereco.cep)) {
                logger.warnLogger.warn('CEP inválido ao tentar criar uma loja', { cep: endereco?.cep });
                return res.status(400).json({ message: 'O campo "cep" é obrigatório e deve ser um CEP válido de 8 dígitos.' });
            }

            // Validação do campo "número"
            if (!endereco.numero) {
                logger.warnLogger.warn('Número inválido ao tentar criar uma loja', { numero: endereco?.numero });
                return res.status(400).json({ message: 'O campo "número" é obrigatório.' });
            }

            const lojaExistente = await Loja.findOne({ 'endereco.cep': endereco.cep });
            if (lojaExistente) {
                logger.warnLogger.warn('Tentativa de criar uma loja com CEP duplicado', { cep: endereco.cep });
                return res.status(400).json({ message: 'Já existe uma loja cadastrada com este CEP.' });
            }

            // Buscar o endereço completo pelo CEP utilizando a API ViaCEP
            const enderecoCompleto = await buscarEnderecoCep(endereco.cep);

            // Se o ViaCEP não encontrar o endereço
            if (!enderecoCompleto) {
                logger.warnLogger.warn('Endereço não encontrado para o CEP fornecido', { cep: endereco.cep });
                return res.status(400).json({ message: 'CEP inválido ou não encontrado.' });
            }

            // Verificar se algum campo retornado é "vazio"
            const camposObrigatorios = ['logradouro', 'bairro', 'localidade', 'uf'];
            const camposPendentes = camposObrigatorios.filter(campo => !enderecoCompleto[campo]);

           // Se algum campo estiver pendente, solicitar que o usuário forneça
           const camposCompletos = camposPendentes.length > 0 ? camposPendentes.reduce((acc, campo) => {
                if (!endereco[campo]) {
                    logger.warnLogger.warn(`Campo "${campo}" pendente. Solicitando preenchimento pelo usuário`, { campo });
                    acc.push(campo);
                }
                return acc;
            }, []) : [];

            if (camposCompletos.length > 0) {
                return res.status(400).json({
                    message: `Os seguintes campos do endereço estão pendentes e precisam ser fornecidos: ${camposCompletos.join(', ')}`,
                    camposPendentes: camposCompletos
                });
            }

             // Preencher os campos de endereço com os dados retornados pela API ViaCEP, ou com os dados fornecidos pelo usuário
            const novoEndereco = {
                logradouro: enderecoCompleto.logradouro || endereco.logradouro,
                bairro: enderecoCompleto.bairro || endereco.bairro,
                cidade: enderecoCompleto.localidade || endereco.cidade,
                estado: enderecoCompleto.uf || endereco.estado,
                cep: endereco.cep,
                numero: endereco.numero
            };
            // Criação da loja com o endereço completo
            const loja = await Loja.create({ nome, endereco: novoEndereco });

            logger.infoLogger.info('Loja criada com sucesso', { loja });
            res.status(201).json(loja);

        } catch (err) {
            logger.errorLogger.error('Erro ao criar a loja', { error: err.message });
            res.status(500).json({ message: 'Erro ao criar a loja', error: err.message });
        }
    }
    // Localizar lojas a até 100 km de distância
    static async localizarLoja(req, res) {
        try {
            const { cep } = req.params;

            logger.infoLogger.info('Iniciando busca de lojas próximas', { cep });

            // Buscar coordenadas pelo CEP do usuário
            const coordenadasUsuario = await converterCepCoordenadas(cep);

            // Obter todas as lojas cadastradas no banco de dados
            const lojas = await Loja.find();

            if (lojas.length === 0) {
                logger.warnLogger.warn('Nenhuma loja cadastrada.');
                return res.status(404).json({ message: 'Nenhuma loja cadastrada.' });
            }

            const lojasProximas = [];

            // Criar um array de promessas para buscar as coordenadas de cada loja e calcular a distância
            const promessasCoordenadas = lojas.map(async (loja) => {
                try {
                    const coordenadasLoja = await converterCepCoordenadas(loja.endereco.cep);
                    const distancia = calcularDistancia(coordenadasUsuario, coordenadasLoja);

                    // Se a distância for menor ou igual a 100 km, adicionar a loja à lista de lojas próximas
                    if (distancia <= 100) {
                        lojasProximas.push({
                            nome: loja.nome,
                            endereco: loja.endereco,
                            distancia: `${distancia.toFixed(2)} km`,
                            coordenadas: {
                                latitude: coordenadasLoja.latitude,
                                longitude: coordenadasLoja.longitude,
                            },
                        });
                    }
                } catch (error) {
                    logger.warnLogger.warn(`Erro ao buscar coordenadas para a loja: ${loja.nome}.`, { error: error.message });
                }
            });

            // Esperar que todas as promessas de coordenadas sejam resolvidas
            await Promise.all(promessasCoordenadas);

            // Se não encontrar nenhuma loja dentro do raio de 100 km
            if (lojasProximas.length === 0) {
                logger.infoLogger.info('Nenhuma loja encontrada dentro de um raio de 100 km.', { cep });
                return res.status(404).json({ message: 'Nenhuma loja encontrada dentro de um raio de 100 km.' });
            }

            logger.infoLogger.info('Lojas próximas encontradas', {
                totalLojas: lojasProximas.length,
                cepUsuario: cep
            });

            // Retornar as lojas dentro do raio de 100 km
            res.status(200).json({ lojas: lojasProximas });

        } catch (error) {
            logger.errorLogger.error('Erro ao localizar lojas', { error: error.message || error });
            res.status(500).json({ message: 'Erro ao localizar lojas', error: error.message });
        }
    }
}