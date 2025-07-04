const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  client: { type: String },
  phoneNumber: { type: String, required: true },
  jobTitle: { type: String },
  email: { type: String, required: true },
  fax: { type: String },
  clientSource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClientSource'
  },
  billingStreet: { type: String, required: true },
  billingCity: { type: String, required: true },
  billingState: { type: String, required: true },
  billingCode: { type: String, required: true },
  billingCountry: { type: String, required: true },
  shippingSameAsBilling: { type: Boolean, default: false },
  shippingStreet: { type: String },
  shippingCity: { type: String },
  shippingState: { type: String },
  shippingCode: { type: String },
  shippingCountry: { type: String },
  attachments: [{ type: String }],
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contact', contactSchema);