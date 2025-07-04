const express = require('express');
const router = express.Router();
const controller = require('../controllers/candidateStatusController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated , controller.getAll);
router.get('/add', isAuthenticated , controller.showAddForm);
router.post('/add', isAuthenticated , controller.create);
router.get('/edit/:id', isAuthenticated , controller.showEditForm);
router.post('/edit/:id', isAuthenticated , controller.update);
router.get('/delete/:id', isAuthenticated , controller.delete);

module.exports = router;