const router = require('express').Router();
const LojaController = require('../controllers/LojaController');


// CRUD routes para LojaController

router.post(
    '/create', 
    LojaController.createLoja,
);

router.get(
    '/listar', 
    LojaController.listarLojas,
);

router.put(
    '/:id', 
    LojaController.atualizarLoja,
);

router.delete(
    '/:id', 
    LojaController.deletarLoja,
);

router.get(
    '/localizar/:cep', 
    LojaController.localizarLoja,
);

module.exports = router;
