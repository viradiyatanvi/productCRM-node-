const ClientSource = require('../models/ClientSource');

exports.index = async (req, res) => {
  try {
    const clientSources = await ClientSource.find().sort({ createdAt: -1 });
    res.render('clientSources/index', { 
      title: 'Client Sources',
      clientSources 
    });
  } catch (err) {
    req.flash('error_msg', 'Error fetching client sources');
    res.redirect('/');
  }
};

exports.create = (req, res) => {
  res.render('clientSources/create', { 
    title: 'Add New Client Source' 
  });
};

exports.store = async (req, res) => {
  try {
    const { name } = req.body;
    const newClientSource = new ClientSource({ name });
    await newClientSource.save();
    req.flash('success_msg', 'Client source created successfully');
    res.redirect('/client/cientSource');
  } catch (err) {
    if (err.name === 'ValidationError') {
      req.flash('error_msg', Object.values(err.errors).map(val => val.message));
    } else if (err.code === 11000) {
      req.flash('error_msg', 'Client source with this name already exists');
    } else {
      req.flash('error_msg', 'Error creating client source');
    }
    res.redirect('/client/cientSource/create');
  }
};

exports.edit = async (req, res) => {
  try {
    const clientSource = await ClientSource.findById(req.params.id);
    if (!clientSource) {
      req.flash('error_msg', 'Client source not found');
      return res.redirect('/client/cientSource');
    }
    res.render('clientSources/edit', { 
      title: 'Edit Client Source',
      clientSource 
    });
  } catch (err) {
    req.flash('error_msg', 'Error fetching client source');
    res.redirect('/client/cientSource');
  }
};

exports.update = async (req, res) => {
  try {
    const { name, status } = req.body;
    const clientSource = await ClientSource.findByIdAndUpdate(
      req.params.id,
      { name, status },
      { new: true, runValidators: true }
    );
    if (!clientSource) {
      req.flash('error_msg', 'Client source not found');
      return res.redirect('/client/cientSource');
    }
    req.flash('success_msg', 'Client source updated successfully');
    res.redirect('/client/cientSource');
  } catch (err) {
    if (err.name === 'ValidationError') {
      req.flash('error_msg', Object.values(err.errors).map(val => val.message));
    } else if (err.code === 11000) {
      req.flash('error_msg', 'Client source with this name already exists');
    } else {
      req.flash('error_msg', 'Error updating client source');
    }
    res.redirect(`/client/cientSource/${req.params.id}/edit`);
  }
};


exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    // Delete client source using correct model
    const deleted = await ClientSource.findByIdAndDelete(id);

    if (!deleted) {
      req.flash('error_msg', 'Client source not found');
      return res.redirect('/client/cientSource');
    }

    req.flash('success_msg', 'Client source deleted successfully');
    res.redirect('/client/cientSource');
  } catch (error) {
    console.error('Delete error:', error);
    req.flash('error_msg', 'Error deleting client source');
    res.redirect('/client/cientSource');
  }
};