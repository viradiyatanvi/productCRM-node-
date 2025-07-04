const express = require('express');
const router = express.Router();
const jobOpenStatusController = require('../controllers/jobOpenStatusController');
const { isAuthenticated } = require('../middleware/auth');

// Job Open Status Routes
router.get('/', isAuthenticated , jobOpenStatusController.listJobOpenStatuses);
router.get('/add', isAuthenticated , jobOpenStatusController.getAddJobOpenStatusForm);
router.post('/add', isAuthenticated , jobOpenStatusController.postAddJobOpenStatus);
router.get('/edit/:id', isAuthenticated , jobOpenStatusController.getEditJobOpenStatusForm);
router.post('/edit/:id', isAuthenticated , jobOpenStatusController.postEditJobOpenStatus);
router.post('/delete/:id', isAuthenticated , jobOpenStatusController.deleteJobOpenStatus);

module.exports = router;