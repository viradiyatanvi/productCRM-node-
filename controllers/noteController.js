const Note = require('../models/Note');
const NoteType = require('../models/NoteType');
const Candidate = require('../models/Candidate'); // Assuming you have a Candidate model
const fs = require('fs');
const path = require('path');


const getImageUrl = (filename) => {
  return filename ? `/uploads/notes/${filename}` : null;
};

exports.list = async (req, res) => {
  try {
    const notes = await Note.find()
      .populate({
        path: 'noteType',
        model: 'NoteType'
      })
      .populate({
        path: 'relatedTo',
        model: 'Candidate',
        select: 'firstName lastName email'  // सिर्फ ये fields लें
      })
      .sort({ updatedAt: -1 });

    // डीबगिंग के लिए लॉग
    console.log('Sample Note:', {
      title: notes[0]?.title,
      relatedTo: notes[0]?.relatedTo,
      hasRelatedTo: !!notes[0]?.relatedTo
    });

    const processedNotes = notes.map(note => ({
      ...note.toObject(),
      imageUrl: note.image ? `/uploads/notes/${note.image}` : null,
      candidateName: note.relatedTo 
        ? `${note.relatedTo.firstName} ${note.relatedTo.lastName}`.trim()
        : 'N/A'
    }));

    res.render('note/list', {
      notes: processedNotes,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (err) {
    console.error('Error fetching notes:', err);
    req.flash('error', 'Failed to fetch notes');
    res.redirect('/');
  }
};

exports.addForm = async (req, res) => {
  try {
    const noteTypes = await NoteType.find({ status: 'Active' });
    const candidates = await Candidate.find().select('firstName lastName');

    let formData = req.flash('formData')[0] || {};
    if (req.query.candidateId) {
      formData = {
        ...formData,
        relatedTo: req.query.candidateId,
      };
    }

    res.render('note/add', {
      noteTypes,
      candidates,
      formData
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to load form');
    res.redirect('/note');
  }
};


exports.create = async (req, res) => {
  try {
    const { title, description, noteType, relatedTo } = req.body;
    
    if (!title || !noteType) {
      req.flash('error', 'Title and Note Type are required');
      req.flash('formData', req.body);
      return res.redirect('/note/add');
    }

    const note = new Note({
      title,
      description,
      noteType,
      relatedTo: relatedTo || null,
      image: req.file?.filename
    });

    await note.save();
    req.flash('success', 'Note added successfully');
    res.redirect('/note');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to add note');
    req.flash('formData', req.body);
    res.redirect('/note/add');
  }
};

exports.view = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate({
        path: 'noteType'
      })
      .populate({
        path: 'relatedTo',
        model: 'Candidate',
        select: 'firstName lastName' // Ensure both are selected
      });

    if (!note) {
      req.flash('error', 'Note not found');
      return res.redirect('/note');
    }

    res.render('note/view', {
      note: {
        ...note.toObject(),
        imageUrl: getImageUrl(note.image)
      },
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to fetch note');
    res.redirect('/note');
  }
};


exports.editForm = async (req, res) => {
  try {
    const [note, noteTypes, candidates] = await Promise.all([
      Note.findById(req.params.id),
      NoteType.find({ status: 'Active' }),
      Candidate.find().select('firstName lastName')
    ]);

    if (!note) {
      req.flash('error', 'Note not found');
      return res.redirect('/note');
    }

    let formData = req.flash('formData')[0] || note.toObject();

    res.render('note/edit', {
      note,
      noteTypes,
      candidates, // ✅ pass candidates to EJS
      formData
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to load edit form');
    res.redirect('/note');
  }
};


exports.update = async (req, res) => {
  try {
    const { title, description, noteType, relatedTo } = req.body;
    
    if (!title || !noteType) {
      req.flash('error', 'Title and Note Type are required');
      req.flash('formData', req.body);
      return res.redirect(`/note/edit/${req.params.id}`);
    }

    const updateData = {
      title,
      description,
      noteType,
      relatedTo: relatedTo || null,
    };

    if (req.file?.filename) {
      updateData.image = req.file.filename;
    }

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedNote) {
      req.flash('error', 'Note not found');
      return res.redirect('/note');
    }

    req.flash('success', 'Note updated successfully');
    res.redirect('/note');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to update note');
    req.flash('formData', req.body);
    res.redirect(`/note/edit/${req.params.id}`);
  }
};

exports.delete = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      req.flash('error', 'Note not found');
      return res.redirect('/note');
    }

    // Delete associated image file if exists
    if (note.image) {
      const imagePath = path.join(__dirname, '../../public/uploads/notes', note.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Note.findByIdAndDelete(req.params.id);
    req.flash('success', 'Note deleted successfully');
    res.redirect('/note');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to delete note');
    res.redirect('/note');
  }
};