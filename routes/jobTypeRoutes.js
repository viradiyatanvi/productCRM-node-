const express = require('express');
const router = express.Router();
const jobTypeController = require('../controllers/jobTypeController');
const { isAuthenticated } = require('../middleware/auth');

// Job Type Routes
router.get('/', isAuthenticated , jobTypeController.listJobTypes);
router.get('/add', isAuthenticated , jobTypeController.getAddJobTypeForm);
router.post('/add', isAuthenticated , jobTypeController.postAddJobType);
router.get('/view/:id', isAuthenticated , jobTypeController.viewJobType);
router.post('/delete/:id', isAuthenticated , jobTypeController.deleteJobType);

module.exports = router;