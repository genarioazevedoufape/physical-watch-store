const Store = require('../models/Store');

module.exports = class StoreController {
 
    // create Store
    static createStore(req, res) {
        res.json({ message: 'Create Store' });

    }
}