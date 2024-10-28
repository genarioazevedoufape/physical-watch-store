const router = require('express').Router();
const LojaController = require('../controllers/LojaController');


// CRUD routes para LojaController

// Criar loja
router.post(
    '/create', 
    LojaController.createLoja,
);

// Listar lojas
router.get(
    '/listar', 
    LojaController.listarLojas,
);

// Buscar loja por ID
router.get(
    '/buscar/:id', 
    LojaController.buscarLojaPorId,
);

// Atualizar loja
router.put(
    '/:id', 
    LojaController.atualizarLoja,
);

// Deletar loja
router.delete(
    '/:id', 
    LojaController.deletarLoja,
);

// Localizar loja por CEP
router.get(
    '/localizar/:cep', 
    LojaController.localizarLoja,
);

module.exports = router;
