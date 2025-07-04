const mongoose = require('mongoose');

const noteTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Type name is required'],
    unique: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, { timestamps: true });

// Update timestamp before saving
noteTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('NoteType', noteTypeSchema);