const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const { isAuthenticated } = require('../middleware/auth');
const Manager = require('../models/Manager');

// Show Add Manager Form
router.get('/add', isAuthenticated, (req, res) => {
  res.render('manager/add', {
    user: req.user || req.session.user,
    formData: {}
  });
});

// Handle Add Manager POST
router.post('/add', isAuthenticated, async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      alternatePhone,
      company,
      notes,
      addresses
    } = req.body;

    const addressArray = Object.values(addresses || {});

    const newManager = new Manager({
      fullName,
      email,
      phone,
      alternatePhone,
      company,
      notes,
      addresses: addressArray,
      createdBy: req.user?._id || req.session?.user?._id
    });

    await newManager.save();
    res.redirect('/manager');
  } catch (err) {
    console.error("Add Manager Error:", err);
    res.status(500).render('manager/add', {
      user: req.user || req.session.user,
      formData: req.body,
      error: " Failed to add manager. Please try again."
    });
  }
});

// List Managers
router.get('/', isAuthenticated, managerController.getAllManagers);

// Quick Create from Contact
router.post('/quick-create', isAuthenticated, managerController.quickCreateFromContact);

// Edit Manager
router.get('/edit/:id', isAuthenticated, managerController.getManagerEditPage);
router.post('/edit/:id', isAuthenticated, managerController.updateManager);

// Delete Manager
router.post('/delete/:id', isAuthenticated, managerController.deleteManager);

module.exports = router;