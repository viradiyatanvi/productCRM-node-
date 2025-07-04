const Candidate = require('../models/CandidateStatusModel');

// List All
exports.getAll = async (req, res) => {
    const candidates = await Candidate.find().sort({ updatedAt: -1 });
    res.render('candidateStatus/list', { candidates });
};

// Show Add Form
exports.showAddForm = (req, res) => {
    res.render('candidateStatus/form', { candidate: null });
};

// Create
exports.create = async (req, res) => {
    await Candidate.create({ name: req.body.name });
    res.redirect('/candidate/status');
};

// Show Edit Form
exports.showEditForm = async (req, res) => {
    const candidate = await Candidate.findById(req.params.id);
    res.render('candidateStatus/form', { candidate });
};

// Update
exports.update = async (req, res) => {
    await Candidate.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        status: req.body.status
    });
    res.redirect('/candidate/status');
};

// Delete
exports.delete = async (req, res) => {
    await Candidate.findByIdAndDelete(req.params.id);
    res.redirect('/candidate/status');
};