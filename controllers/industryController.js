const Industry = require('../models/Industry');

exports.index = async (req, res) => {
  try {
    const industries = await Industry.find().sort({ createdAt: -1 });
    res.render('industries/index', { 
      title: 'Industries',
      industries 
    });
  } catch (err) {
    req.flash('error_msg', 'Error fetching industries');
    res.redirect('/');
  }
};

exports.create = (req, res) => {
  res.render('industries/create', { 
    title: 'Add New Industry' 
  });
};

exports.store = async (req, res) => {
  try {
    const { name } = req.body;
    const newIndustry = new Industry({ name });
    await newIndustry.save();
    req.flash('success_msg', 'Industry created successfully');
    res.redirect('/industries');
  } catch (err) {
    if (err.name === 'ValidationError') {
      req.flash('error_msg', Object.values(err.errors).map(val => val.message));
    } else if (err.code === 11000) {
      req.flash('error_msg', 'Industry with this name already exists');
    } else {
      req.flash('error_msg', 'Error creating industry');
    }
    res.redirect('/industries/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const industry = await Industry.findById(req.params.id);
    if (!industry) {
      req.flash('error_msg', 'Industry not found');
      return res.redirect('/industries');
    }
    res.render('industries/edit', { 
      title: 'Edit Industry',
      industry 
    });
  } catch (err) {
    req.flash('error_msg', 'Error fetching industry');
    res.redirect('/industries');
  }
};

exports.update = async (req, res) => {
  try {
    const { name, status } = req.body;
    const industry = await Industry.findByIdAndUpdate(
      req.params.id,
      { name, status },
      { new: true, runValidators: true }
    );
    if (!industry) {
      req.flash('error_msg', 'Industry not found');
      return res.redirect('/industries');
    }
    req.flash('success_msg', 'Industry updated successfully');
    res.redirect('/industries');
  } catch (err) {
    if (err.name === 'ValidationError') {
      req.flash('error_msg', Object.values(err.errors).map(val => val.message));
    } else if (err.code === 11000) {
      req.flash('error_msg', 'Industry with this name already exists');
    } else {
      req.flash('error_msg', 'Error updating industry');
    }
    res.redirect(`/industries/${req.params.id}/edit`);
  }
};

exports.delete = async (req, res) => {
  try {
    const id=req.params.id;
    const industry = await Industry.findByIdAndDelete(id);
    if (!industry) {
      req.flash('error_msg', 'Industry not found');
      return res.redirect('/industries');
    }
    req.flash('success_msg', 'Industry deleted successfully');
    res.redirect('/industries');
  } catch (err) {
    req.flash('error_msg', 'Error deleting industry');
    res.redirect('/industries');
  }
};