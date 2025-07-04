const express = require('express');
const router = express.Router();
const noteTypeController = require('../controllers/noteTypeController');
const { isAuthenticated } = require('../middleware/auth');

// NoteType routes
router.get('/', isAuthenticated, noteTypeController.list);
router.get('/add', isAuthenticated, noteTypeController.addForm);
router.post('/add', isAuthenticated, noteTypeController.create);
router.get('/edit/:id', isAuthenticated, noteTypeController.editForm);
router.post('/edit/:id', isAuthenticated, noteTypeController.update);
router.get('/delete/:id', isAuthenticated, noteTypeController.delete);

module.exports = router;