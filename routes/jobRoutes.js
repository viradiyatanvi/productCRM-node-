const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const upload = require('../middleware/upload/candidate');
const { isAuthenticated } = require('../middleware/auth');

// Job Routes
router.get('/', isAuthenticated , jobController.listJobs);
router.get('/add', isAuthenticated , jobController.getAddJobForm);
router.post('/add', isAuthenticated , upload.array('attachments'), jobController.postAddJob);
router.get('/view/:id', isAuthenticated , jobController.viewJob);
router.get('/edit/:id', isAuthenticated , jobController.getEditJobForm);
router.post('/edit/:id', isAuthenticated , upload.array('attachments'), jobController.postEditJob);
router.post('/delete/:id', isAuthenticated , jobController.deleteJob);

module.exports = router;