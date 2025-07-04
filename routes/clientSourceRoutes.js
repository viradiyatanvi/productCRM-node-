const express = require('express');
const router = express.Router();
const clientSourceController = require('../controllers/clientSourceController');
const { isAuthenticated } = require('../middleware/auth');

// Client Source Routes
router.get('/', isAuthenticated , clientSourceController.index);
router.get('/create', isAuthenticated , clientSourceController.create);
router.post('/', isAuthenticated , clientSourceController.store);
router.get('/:id/edit', isAuthenticated , clientSourceController.edit);
router.post('/:id', isAuthenticated , clientSourceController.update);
router.get('/delete/:id', isAuthenticated , clientSourceController.delete);

module.exports = router;