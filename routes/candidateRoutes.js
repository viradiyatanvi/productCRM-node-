const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidateController');
const {isAuthenticated}=require('../middleware/auth');
const Candidate=require('../controllers/candidateController');
const Contact = require('../models/Contact');

// Show Add Form

router.get('/add', isAuthenticated, async (req, res) => {
  try {
    const contacts = await Contact.find(); 
    res.render('candidate/add', {
      user: req.user || req.session.user,
      contacts 
    });
  } catch (err) {
    console.error("Fetch contacts error:", err);
    res.status(500).send("Error loading form");
  }
});

// Handle Add Submission
router.post('/add', isAuthenticated, async (req, res) => {
  try {
    const data = req.body;
    const Candidate = require('../models/Candidate');
    const candidate = new Candidate(data);
    await candidate.save();
    res.redirect('/candidate');
  } catch (err) {
    console.error("Add Error:", err);
    res.status(500).send('Error adding candidate');
  }
});


router.get('/',isAuthenticated,candidateController.getAllCandidates);
router.post('/quick-create',isAuthenticated,candidateController.quickCreateFromContact);

router.get('/edit/:id',isAuthenticated,candidateController.getCandidateJson);
router.post('/edit/:id',isAuthenticated,candidateController.updateCandidate);

router.delete('/delete/:id',isAuthenticated,candidateController.deleteCandidate);

module.exports = router;
