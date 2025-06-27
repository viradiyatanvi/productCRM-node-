const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  address: String,
  city: String,
  state: String,
  pincode: String
});

const managerSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: String,
  phone: { type: String, required: true },
  alternatePhone: String,
  company: String,
  notes: String,
  addresses: [addressSchema],
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Manager', managerSchema);