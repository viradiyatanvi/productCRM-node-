const CandidateSource = require('../models/CandidateSource');

// List all
exports.getAll = async (req, res) => {
  const sources = await CandidateSource.find().sort({ updatedAt: -1 });
  res.render('candidateSource/list', { sources });
};

// Show add form
exports.showAddForm = (req, res) => {
  res.render('candidateSource/add', { source: null });
};

// Add new
exports.create = async (req, res) => {
  await CandidateSource.create({ name: req.body.name });
  res.redirect('/candidate/source');
};

// Show edit form
exports.showEditForm = async (req, res) => {
  const source = await CandidateSource.findById(req.params.id);
  res.render('candidateSource/edit', { source });
};

// Update
exports.update = async (req, res) => {
  await CandidateSource.findByIdAndUpdate(req.params.id, {
    name: req.body.name,
    status: req.body.status
  });
  res.redirect('/candidate/source');
};

// Delete
exports.delete = async (req, res) => {
  await CandidateSource.findByIdAndDelete(req.params.id);
  res.redirect('/candidate/source');
};