const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const upload = require('../middleware/upload/note');
const { isAuthenticated } = require('../middleware/auth');

// मुख्य routes
router.get('/', isAuthenticated, noteController.list);
router.get('/add', isAuthenticated, noteController.addForm);
router.post('/add', isAuthenticated, upload.single('image'), noteController.create);
router.get('/view/:id', isAuthenticated, noteController.view);
router.get('/edit/:id', isAuthenticated, noteController.editForm);
router.post('/edit/:id', isAuthenticated, upload.single('image'), noteController.update);
router.get('/delete/:id', isAuthenticated, noteController.delete);


module.exports = router;