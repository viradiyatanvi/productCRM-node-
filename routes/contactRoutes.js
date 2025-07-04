const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { isAuthenticated } = require('../middleware/auth');
const upload = require('../middleware/upload'); 
const Contact = require('../models/Contact');

// Main contact routes
router.get('/', isAuthenticated, contactController.listContacts);
router.get('/add', isAuthenticated, contactController.getAddContactForm);
router.post('/add', isAuthenticated, upload.array('attachments'), contactController.postAddContact);

// Contact list route
router.get('/list', isAuthenticated, async (req, res) => {
  try {
    const contacts = await Contact.find().populate('assignedTo', 'name');
    res.render('contact/list', { contacts, user: req.session.user });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Single contact view route
router.get('/view/:id', isAuthenticated, async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id).populate('assignedTo', 'name').populate('client', 'clientName').populate('clientSource', 'name');
    res.render('contact/view-single', { contact, user: req.session.user });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete contact routes
router.post('/delete/:id', isAuthenticated, async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    req.flash('success', 'Contact deleted successfully');
    res.redirect('/contact');
  } catch (err) {
    console.error("Delete Error:", err);
    req.flash('error', 'Failed to delete contact');
    res.redirect('/contact');
  }
});

module.exports = router;