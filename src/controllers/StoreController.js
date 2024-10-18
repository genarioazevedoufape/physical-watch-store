const Store = require('../models/Store');

module.exports = class StoreController {
 
    // create Store
    static createStore(req, res) {
        Store.create(req.body)
            .then(store => res.status(201).json(store))
            .catch(err => res.status(500).json(err));
    }

    static locateStore(req, res) {
        res.status(200).json({message: 'Store located'});

    }
}