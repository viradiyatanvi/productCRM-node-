const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true
  },
  fax: String,
  telegram: {
    type: String,
    required: true
  },
  industry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Industry',
    required: true
  },
  about: String,
  contactNumber: {
    type: String,
    required: true
  },
  website: String,
  server: {
    type: String,
    required: true
  },
  clientSource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientSource',
    required: true
  },
  billingStreet: {
    type: String,
    required: true
  },
  billingState: {
    type: String,
    required: true
  },
  billingCountry: {
    type: String,
    required: true
  },
  billingCity: {
    type: String,
    required: true
  },
  billingCode: {
    type: String,
    required: true
  },
  shippingStreet: String,
  shippingState: String,
  shippingCity: String,
  shippingCode: String,
  attachments: [{
    filename: String,
    path: String
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);