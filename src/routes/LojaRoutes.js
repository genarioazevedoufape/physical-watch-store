const router = require('express').Router();
const LojaController = require('../controllers/LojaController');

router.post(
    '/create', 
    LojaController.createLoja,
);

router.get(
    '/localizar/:cep', 
    LojaController.localizarLoja,
);

module.exports = router;
