const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  alternatePhone: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  company: { type: String, trim: true },
  status: {
    type: String,
    enum: ['new', 'interested', 'not_interested', 'follow_up', 'converted'],
    default: 'new'
  },
  notes: { type: String, trim: true },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: false         
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Candidate', candidateSchema);