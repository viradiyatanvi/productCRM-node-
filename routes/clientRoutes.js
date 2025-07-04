// routes/clients.js
const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const upload = require('../middleware/upload/candidate');
const { isAuthenticated } = require('../middleware/auth');

// Client Routes
router.get('/', isAuthenticated , clientController.index);
router.get('/create', isAuthenticated , clientController.create);
router.post('/', isAuthenticated , upload.array('attachments'), clientController.store);
router.get('/view/:id', isAuthenticated , clientController.view);
router.get('/:id/edit', isAuthenticated , clientController.edit);
router.put('/:id', isAuthenticated , upload.array('attachments'), clientController.update);
router.post('/:id', isAuthenticated , clientController.delete);

module.exports = router;