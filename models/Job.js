const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  industry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Industry',
    required: true
  },
  jobOpenStatus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobOpenStatus',
    required: true
  },
  maxExperience: {
    type: Number,
    required: true
  },
  maxSalary: {
    type: Number,
    required: true
  },
  totalVacancy: {
    type: Number,
    required: true
  },
  applicationDeadline: {
    type: Date,
    required: true
  },
  jobType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobType',
    required: true
  },
  minExperience: {
    type: Number,
    required: true
  },
  minSalary: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'BRL'
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  description: {
    rolesResponsibility: String,
    jobRequirements: String,
    additionalRequirements: String,
    benefits: String,
    applyInstructions: String
  },
  attachments: [{
    filename: String,
    path: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);