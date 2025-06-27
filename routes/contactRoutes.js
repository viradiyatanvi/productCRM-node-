const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const {isAuthenticated}=require('../middleware/auth');

router.get('/',isAuthenticated,contactController.listContacts);
router.get('/add',isAuthenticated,contactController.getAddContactForm);
router.post('/add',isAuthenticated,contactController.postAddContact);

module.exports = router;
