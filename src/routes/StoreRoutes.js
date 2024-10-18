const router = require('express').Router();
const StoreController = require('../controllers/StoreController');


router.post(
    '/create', 
    StoreController.createStore,
);

router.get(
    '/locate', 
    StoreController.locateStore,
);

module.exports = router;
