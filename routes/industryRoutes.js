const express = require('express');
const router = express.Router();
const industryController = require('../controllers/industryController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated , industryController.index);
router.get('/create', isAuthenticated , industryController.create);
router.post('/', isAuthenticated , industryController.store);
router.get('/:id/edit', isAuthenticated , industryController.edit);
router.post('/:id', isAuthenticated , industryController.update);
router.get('/delete/:id', isAuthenticated , industryController.delete);

module.exports = router;