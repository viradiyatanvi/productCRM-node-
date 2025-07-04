const NoteType = require('../models/NoteType');

exports.list = async (req, res) => {
  try {
    const noteTypes = await NoteType.find().sort({ updatedAt: -1 });
    res.render('noteType/list', { 
      noteTypes,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to fetch note types');
    res.redirect('/');
  }
};

exports.addForm = (req, res) => {
  res.render('noteType/add', {
    formData: req.flash('formData')[0] || {}
  });
};

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      req.flash('error', 'Type name is required');
      req.flash('formData', req.body);
      return res.redirect('/note/notetype/add');
    }

    const noteType = new NoteType({
      name,
      status: 'Active'
    });

    await noteType.save();
    req.flash('success', 'Note type added successfully');
    res.redirect('/note/notetype');
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      req.flash('error', 'Note type name already exists');
    } else {
      req.flash('error', 'Failed to add note type');
    }
    req.flash('formData', req.body);
    res.redirect('/note/notetype/add');
  }
};

exports.editForm = async (req, res) => {
  try {
    const noteType = await NoteType.findById(req.params.id);
    if (!noteType) {
      req.flash('error', 'Note type not found');
      return res.redirect('/note/notetype');
    }
    res.render('noteType/edit', { noteType });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to fetch note type');
    res.redirect('/note/notetype');
  }
};

exports.update = async (req, res) => {
  try {
    const { name, status } = req.body;
    
    if (!name) {
      req.flash('error', 'Type name is required');
      return res.redirect(`/note/notetype/edit/${req.params.id}`);
    }

    const noteType = await NoteType.findByIdAndUpdate(
      req.params.id,
      { name, status, updatedAt: Date.now() },
      { new: true }
    );

    if (!noteType) {
      req.flash('error', 'Note type not found');
      return res.redirect('/note/notetype');
    }

    req.flash('success', 'Note type updated successfully');
    res.redirect('/note/notetype');
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      req.flash('error', 'Note type name already exists');
    } else {
      req.flash('error', 'Failed to update note type');
    }
    res.redirect(`/note/notetype/edit/${req.params.id}`);
  }
};

exports.delete = async (req, res) => {
  try {
    const noteType = await NoteType.findByIdAndDelete(req.params.id);
    if (!noteType) {
      req.flash('error', 'Note type not found');
    } else {
      req.flash('success', 'Note type deleted successfully');
    }
    res.redirect('/note/notetype');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to delete note type');
    res.redirect('/note/notetype');
  }
};