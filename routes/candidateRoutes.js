const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const upload = require('../middleware/upload/candidate');
const { isAuthenticated } = require('../middleware/auth');
const { authenticate } = require('passport');

// Candidate routes
router.get('/', isAuthenticated, candidateController.list);
router.get('/add', isAuthenticated, candidateController.addForm);
router.post('/add', upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'coverLetter', maxCount: 1 },
  { name: 'contract', maxCount: 1 }
]), candidateController.create);
router.get('/edit/:id', isAuthenticated, candidateController.editForm);
router.post('/edit/:id', isAuthenticated,upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'resume', maxCount: 1 },  
  { name: 'coverLetter', maxCount: 1 },
  { name: 'contract', maxCount: 1 }
]), candidateController.update);
router.get('/delete/:id',authenticate , candidateController.delete);
router.get('/view/:id', isAuthenticated, candidateController.view);

router.get('/contact/:id', isAuthenticated, candidateController.getContactDetails);

module.exports = router;