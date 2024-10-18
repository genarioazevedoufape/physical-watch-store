const router = require('express').Router();
const StoreController = require('../controllers/StoreController');


router.post(
    '/create', 
    StoreController.createStore,
);

module.exports = router;
