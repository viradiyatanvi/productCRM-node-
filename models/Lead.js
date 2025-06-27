const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  interestedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  source: {
    type: String,
    enum: ['web', 'manual', 'excel', 'referral', 'social-media', 'advertisement'],
    default: 'manual'
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'interested', 'not-interested', 'converted', 'lost'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  notes: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  convertedAt: {
    type: Date
  },
  lastContactDate: {
    type: Date
  },
  nextFollowUpDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
leadSchema.index({ email: 1 });
leadSchema.index({ phone: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ nextFollowUpDate: 1 });

// Virtual for lead age
leadSchema.virtual('leadAge').get(function() {
  const days = Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
  return days;
});

// Get status display
leadSchema.methods.getStatusDisplay = function() {
  const statusMap = {
    'new': 'New Lead',
    'contacted': 'Contacted',
    'interested': 'Interested',
    'not-interested': 'Not Interested',
    'converted': 'Converted',
    'lost': 'Lost'
  };
  return statusMap[this.status] || this.status;
};

module.exports = mongoose.model('Lead', leadSchema);