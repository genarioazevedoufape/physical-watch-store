const Loja = require('../models/Loja');
const mongoose = require('mongoose');

const { converterCepCoordenadas } = require('../services/converterCEP');
const { calcularDistancia } = require('../utils/calcularDistancia');
const { buscarEnderecoCep } = require('../services/buscarEnderecoCep');

const logger = require('../utils/logger');

const isValidCep = (cep) => /^[0-9]{8}$/.test(cep);
module.exports = class LojaController {

    // Criar uma nova loja
    static async createLoja(req, res) {
        try {
            const { nome, endereco, coordenadas, informacoes } = req.body;

            // Validação do campo "nome"
            if (!nome) {
                logger.warnLogger.warn('Nome inválido ao tentar criar uma loja', { nome });
                return res.status(400).json({ message: 'O campo "nome" é obrigatório.' });
            }

            // Validação do campo "cep"
            if (!endereco || !endereco.cep || !isValidCep(endereco.cep)) {
                logger.warnLogger.warn('CEP inválido ao tentar criar uma loja', { cep: endereco?.cep });
                return res.status(400).json({ message: 'O campo "cep" é obrigatório e deve ser um CEP válido de 8 dígitos.' });
            }

            // Verificar se já existe uma loja cadastrada com o mesmo CEP e número
            const lojaExistente = await Loja.findOne({ 'endereco.cep': endereco.cep, 'endereco.numero': endereco.numero });
            if (lojaExistente) {
                logger.warnLogger.warn('Tentativa de criar uma loja com CEP e número duplicados', { cep: endereco.cep, numero: endereco.numero });
                return res.status(400).json({ message: 'Já existe uma loja cadastrada com este CEP e número.' });
            }

            // Buscar o endereço completo pelo CEP utilizando a API ViaCEP
            const enderecoCompleto = await buscarEnderecoCep(endereco.cep);

            // Se o ViaCEP não encontrar o endereço
            if (!enderecoCompleto) {
                logger.warnLogger.warn('Endereço não encontrado para o CEP fornecido', { cep: endereco.cep });
                return res.status(400).json({ message: 'CEP inválido ou não encontrado.' });
            }

            // Verificar se algum campo retornado é "vazio"
            const camposObrigatorios = ['logradouro', 'bairro', 'localidade', 'uf', 'numero'];
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
            let novasCoordenadas = {
                latitude: coordenadasCepLoja.latitude,
                longitude: coordenadasCepLoja.longitude
            }

            if (novasCoordenadas.latitude === 0 || novasCoordenadas.longitude === 0) {
                logger.warnLogger.warn('Coordenadas não encontradas para o CEP fornecido.', { cep: endereco.cep });
                if(!coordenadas || !coordenadas.latitude || !coordenadas.longitude) {
                    return res.status(400).json({message: 'Coordenadas não encontradas para o CEP fornecido. Por favor, forneça latitude e longitude.'});
                    } else {
                        novasCoordenadas = {
                            latitude: coordenadas.latitude,
                            longitude: coordenadas.longitude
                        }
                    }
            }
            
            // Validação dos campos de informações (funcionamento e dias de funcionamento)
            if (!informacoes || !informacoes.horarioFuncionamento || !informacoes.diasFuncionamento) {
                logger.warnLogger.warn('Informações de funcionamento ausentes ao tentar criar uma loja', { informacoes });
                return res.status(400).json({ message: 'Os campos "Horário de funcionamento" e "Dias de Funcionamento" são obrigatórios.' });
            }

            // Criação da loja com o endereço completo
            const loja = await Loja.create({ nome, endereco: novoEndereco, coordenadas: novasCoordenadas, informacoes });

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

    // Buscar uma loja pelo ID
    static async buscarLojaPorId(req, res) {
        try {
            const { id } = req.params;

            logger.infoLogger.info('Iniciando busca da loja pelo ID', { id });

            // Verificar se o ID da loja é válido
            if (!mongoose.Types.ObjectId.isValid(id)) {
                logger.warnLogger.warn('ID inválido para buscar a loja', { id });
                return res.status(400).json({ message: 'ID inválido.' });
            }

            // Buscar a loja pelo ID
            const loja = await Loja.findById(id);

            // Verificar se a loja existe
            if (!loja) {
                logger.warnLogger.warn('Loja não encontrada para o ID fornecido', { id });
                return res.status(404).json({ message: 'Loja não encontrada.' });
            }

            logger.infoLogger.info('Loja encontrada com sucesso', { loja });
            res.status(200).json(loja);

        } catch (err) {
            logger.errorLogger.error('Erro ao buscar a loja pelo ID', { error: err.message });
            res.status(500).json({ message: 'Erro ao buscar a loja pelo ID', error: err.message });
        }
    }

    // Atualizar uma loja
    static async atualizarLoja(req, res) {
        try {
            const { id } = req.params;
            const { nome, endereco, coordenadas, informacoes } = req.body;

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
                
            //Preencher as coordenadas da loja
            let novasCoordenadas = {
                latitude: coordenadasCepLoja.latitude,
                longitude: coordenadasCepLoja.longitude
            }
                if (novasCoordenadas.latitude === 0 || novasCoordenadas.longitude === 0) {
                    logger.warnLogger.warn('Coordenadas não encontradas para o CEP fornecido.', { cep: endereco.cep });
                    if(!coordenadas || !coordenadas.latitude || !coordenadas.longitude) {
                        return res.status(400).json({message: 'Coordenadas não encontradas para o CEP fornecido. Por favor, forneça latitude e longitude.'});
                        } else {
                            novasCoordenadas = {
                                latitude: coordenadas.latitude,
                                longitude: coordenadas.longitude
                            }
                        }
                }
                loja.coordenadas = {
                    latitude: novasCoordenadas.latitude,
                    longitude: novasCoordenadas.longitude
                };
            }
            
            // Atualizar informações de funcionamento
            if (informacoes) {
                const { horarioFuncionamento, diasFuncionamento } = informacoes;

                // Atualizar cada campo se ele estiver presente
                if (horarioFuncionamento) {
                    loja.informacoes.horarioFuncionamento = horarioFuncionamento;
                }
                if (diasFuncionamento) {
                    loja.informacoes.diasFuncionamento = diasFuncionamento;
                }

                // Log de validação para os campos informados
                if (!horarioFuncionamento && !diasFuncionamento) {
                    logger.warnLogger.warn('Nenhum campo válido para atualizar em "informações"', { informacoes });
                    return res.status(400).json({ message: 'Informe ao menos um dos campos: "Horário de funcionamento" ou "Dias de Funcionamento".' });
                }
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

            if (!isValidCep(cep)) {
                const errorMsg = 'Formato de CEP inválido. O CEP deve conter 8 dígitos numéricos.';
                logger.errorLogger.error(errorMsg, cep);
                return res.status(400).json({ error: errorMsg });
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

            // Filtrar e mapear diretamente as lojas dentro do raio de 100 km
            const filtroLojasProximas = lojas
            .map((loja) => {
              const coordenadasLoja = loja.coordenadas;
              const distancia = calcularDistancia(coordenadasUsuario, coordenadasLoja);
          
              // Retornar somente as lojas dentro do raio de 100 km
              if (distancia <= 100) {
                return {
                  nome: loja.nome,
                  endereco: loja.endereco,
                  distancia: distancia,
                  informacoes: loja.informacoes
                };
              }
              return null; // Retorna null para lojas fora do raio
            })
            .filter(Boolean) // Remove os valores nulos resultantes do mapeamento
            .sort((a, b) => a.distancia - b.distancia); // Ordena da maior para a menor distância

            // Se desejar formatar a distância para exibição
            const lojasProximas = filtroLojasProximas.map((loja) => ({
                nome: loja.nome,
                endereco: loja.endereco,
                distancia: `${loja.distancia.toFixed(2)} km`, 
                informacoes: loja.informacoes
            }));

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