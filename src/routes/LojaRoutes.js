const router = require('express').Router();
const LojaController = require('../controllers/LojaController');
const logger = require('../utils/logger');


router.post(
    '/create', 
    LojaController.createLoja,
);

router.get(
    '/localizar/:cep', 
    LojaController.localizarLoja,
);

module.exports = router;
