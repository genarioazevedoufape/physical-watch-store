const Loja = require('../models/Loja');
const mongoose = require('mongoose');

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

            // Buscar as coordenadas do CEP da loja
            const coordenadasCepLoja = await converterCepCoordenadas(endereco.cep);

            //Preencher as coordenadas da loja
            const coordenadas = {
                latitude: coordenadasCepLoja.latitude,
                longitude: coordenadasCepLoja.longitude
            }

            // Criação da loja com o endereço completo
            const loja = await Loja.create({ nome, endereco: novoEndereco, coordenadas: coordenadas });

            logger.infoLogger.info('Loja criada com sucesso', { loja });
            res.status(201).json(loja);

        } catch (err) {
            logger.errorLogger.error('Erro ao criar a loja', { error: err.message });
            res.status(500).json({ message: 'Erro ao criar a loja', error: err.message });
        }
    }

    // Listar todas as lojas
    static async listarLojas(req, res) {
        try {
            logger.infoLogger.info('Iniciando a listagem de todas as lojas');

            // Obter todas as lojas do banco de dados
            const lojas = await Loja.find();

            // Verificar se existem lojas cadastradas
            if (lojas.length === 0) {
                logger.warnLogger.warn('Nenhuma loja cadastrada.');
                return res.status(404).json({ message: 'Nenhuma loja cadastrada.' });
            }

            // Retornar todas as lojas
            logger.infoLogger.info(`Foram encontradas ${lojas.length} lojas cadastradas.`);
            res.status(200).json(lojas);

        } catch (error) {
            logger.errorLogger.error('Erro ao listar as lojas', { error: error.message });
            res.status(500).json({ message: 'Erro ao listar as lojas', error: error.message });
        }
    }

    // Atualizar uma loja
    static async atualizarLoja(req, res) {
        try {
            const { id } = req.params;
            const { nome, endereco } = req.body;

            logger.infoLogger.info('Iniciando atualização da loja', { id });

            // Verificar se o ID da loja é válido
            if (!mongoose.Types.ObjectId.isValid(id)) {
                logger.warnLogger.warn('ID inválido para atualizar a loja', { id });
                return res.status(400).json({ message: 'ID inválido.' });
            }

            // Buscar a loja pelo ID
            const loja = await Loja.findById(id);

            // Verificar se a loja existe
            if (!loja) {
                logger.warnLogger.warn('Loja não encontrada para o ID fornecido', { id });
                return res.status(404).json({ message: 'Loja não encontrada.' });
            }

            // Validação de nome
            if (nome) {
                loja.nome = nome;
            }

            // Validação de endereço
            if (endereco) {
                const { cep, logradouro, bairro, cidade, estado, numero } = endereco;

                const isValidCep = (cep) => /^[0-9]{8}$/.test(cep);
                if (cep && !isValidCep(cep)) {
                    logger.warnLogger.warn('CEP inválido ao tentar atualizar a loja', { cep });
                    return res.status(400).json({ message: 'CEP inválido. O CEP deve ter 8 dígitos.' });
                }

                if (cep) loja.endereco.cep = cep;
                if (logradouro) loja.endereco.logradouro = logradouro;
                if (bairro) loja.endereco.bairro = bairro;
                if (cidade) loja.endereco.cidade = cidade;
                if (estado) loja.endereco.estado = estado;
                if (numero) loja.endereco.numero = numero;
            }

            // Atualizar as coordenadas caso o CEP seja modificado
            if (endereco?.cep) {
                const coordenadasCepLoja = await converterCepCoordenadas(endereco.cep);
                loja.coordenadas = {
                    latitude: coordenadasCepLoja.latitude,
                    longitude: coordenadasCepLoja.longitude
                };
            }

            // Salvar as alterações no banco de dados
            await loja.save();

            logger.infoLogger.info('Loja atualizada com sucesso', { loja });
            res.status(200).json({ message: 'Loja atualizada com sucesso.', loja });

        } catch (err) {
            logger.errorLogger.error('Erro ao atualizar a loja', { error: err.message });
            res.status(500).json({ message: 'Erro ao atualizar a loja', error: err.message });
        }
    }

    // Deletar uma loja
    static async deletarLoja(req, res) {
        try {
            const { id } = req.params;

            logger.infoLogger.info('Iniciando exclusão da loja', { id });

            // Verificar se o ID da loja é válido
            if (!mongoose.Types.ObjectId.isValid(id)) {
                logger.warnLogger.warn('ID inválido para exclusão da loja', { id });
                return res.status(400).json({ message: 'ID inválido.' });
            }

            // Buscar a loja pelo ID e deletá-la
            const loja = await Loja.findByIdAndDelete(id);

            // Verificar se a loja existe
            if (!loja) {
                logger.warnLogger.warn('Loja não encontrada para o ID fornecido', { id });
                return res.status(404).json({ message: 'Loja não encontrada.' });
            }

            logger.infoLogger.info('Loja deletada com sucesso', { loja });
            res.status(200).json({ message: 'Loja deletada com sucesso.'});

        } catch (err) {
            logger.errorLogger.error('Erro ao deletar a loja', { error: err.message });
            res.status(500).json({ message: 'Erro ao deletar a loja', error: err.message });
        }
    }


    // Localizar lojas a até 100 km de distância
    static async localizarLoja(req, res) {
        try {
            const { cep } = req.params;

            const isValidCep = (cep) => /^[0-9]{8}$/.test(cep);
            if (!isValidCep(cep)) {
                const errorMsg = 'Formato de CEP inválido. O CEP deve conter 8 dígitos numéricos.';
                logger.errorLogger.error(errorMsg, cep);
                return res.status(500).json({ error: errorMsg });
            }

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
                    const coordenadasLoja = loja.coordenadas;
                    const distancia = calcularDistancia(coordenadasUsuario, coordenadasLoja);

                    // Se a distância for menor ou igual a 100 km, adicionar a loja à lista de lojas próximas
                    if (distancia <= 100) {
                        lojasProximas.push({
                            nome: loja.nome,
                            endereco: loja.endereco,
                            distancia: `${distancia.toFixed(2)} km`,
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