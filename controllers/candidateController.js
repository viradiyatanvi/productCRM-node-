

const Contact = require('../models/Contact');
const Candidate = require('../models/Candidate');

// GET all candidates
exports.getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().populate('contactId');
    res.render('candidate/list', { candidates , user: req.user || req.session.user });
  } catch (err) {
    console.error("Error fetching candidates:", err);
    res.status(500).send("Error fetching candidates");
  }
};

// Create from contact
exports.quickCreateFromContact = async (req, res) => {                
  try {
    const { contactId } = req.body;
    const contact = await Contact.findById(contactId);
    if (!contact) return res.status(404).send("Contact not found");

    await Candidate.create({
      fullName: contact.fullName,
      email: contact.email,
      phone: contact.phone,
      city: contact.city,
      contactId: contact._id
    });

    res.redirect('/candidate');
  } catch (err) {
    console.error("Candidate creation error:", err);
    res.status(500).send("Internal Server Error");
  }
};

// Fetch one for modal
exports.getCandidateJson = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' });
  }
};

// Update candidate
exports.updateCandidate = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      alternatePhone,
      city,
      state,
      company,
      notes,
      status
    } = req.body;

    await Candidate.findByIdAndUpdate(req.params.id, {
      fullName,
      email,
      phone,
      alternatePhone,
      city,
      state,
      company,
      notes,
      status
    });

    res.status(200).send("Updated");
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).send("Update failed");
  }
};

exports.deleteCandidate = async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.status(200).send("Deleted");
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).send("Delete failed");
  }
};
