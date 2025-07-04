const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  noteType: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'NoteType', 
    required: true 
  },
  relatedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Candidate'
  },
  image: String,
  status: { 
    type: String, 
    enum: ['Active', 'Inactive'], 
    default: 'Active' 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Note', noteSchema);