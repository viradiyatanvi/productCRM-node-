const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  issueType: {
    type: String,
    enum: ['technical', 'billing', 'product', 'service', 'complaint', 'request'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed', 'cancelled'],
    default: 'open'
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
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  resolution: {
    type: String,
    trim: true
  },
  attachments: [{
    filename: String,
    path: String,
    mimetype: String
  }],
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

ticketSchema.pre('save', function(next) {
  if (!this.ticketNumber) {
    const timestamp = Date.now().toString().slice(-8);
    this.ticketNumber = `TKT-${timestamp}`;
  }
  next();
});

// Index for efficient queries
ticketSchema.index({ customer: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ createdAt: -1 });

// Get status 
ticketSchema.methods.getStatusDisplay = function() {
  const statusMap = {
    'open': 'Open',
    'in-progress': 'In Progress',
    'resolved': 'Resolved',
    'closed': 'Closed',
    'cancelled': 'Cancelled'
  };
  return statusMap[this.status] || this.status;
};

// Get priority 
ticketSchema.methods.getPriorityDisplay = function() {
  const priorityMap = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'urgent': 'Urgent'
  };
  return priorityMap[this.priority] || this.priority;
};

module.exports = mongoose.model('Ticket', ticketSchema);