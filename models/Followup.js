const mongoose = require('mongoose');

const followupSchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  callStatus: {
    type: String,
    enum: ['interested', 'not-interested', 'callback', 'no-response', 'wrong-number', 'busy'],
    required: true
  },
  remarks: {
    type: String,
    required: true,
    trim: true
  },
  nextFollowUpDate: {
    type: Date
  },
  callDuration: {
    type: Number, // in minutes
    default: 0
  },
  customerResponse: {
    type: String,
    trim: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
followupSchema.index({ lead: 1 });
followupSchema.index({ user: 1 });
followupSchema.index({ nextFollowUpDate: 1 });
followupSchema.index({ createdAt: -1 });

// Get status display
followupSchema.methods.getStatusDisplay = function() {
  const statusMap = {
    'interested': 'Interested',
    'not-interested': 'Not Interested',
    'callback': 'Callback Required',
    'no-response': 'No Response',
    'wrong-number': 'Wrong Number',
    'busy': 'Busy'
  };
  return statusMap[this.callStatus] || this.callStatus;
};

module.exports = mongoose.model('Followup', followupSchema);