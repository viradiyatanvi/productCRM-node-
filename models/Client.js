const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attachmentSchema = new Schema({
  filename: String,
  originalname: String,
  mimetype: String,
  size: Number
});

const branchAddressSchema = new Schema({
  branchName: String,
  branchNumber: String,
  street: String,
  city: String,
  state: String,
  country: String,
  postalCode: String,
  isPrimary: { type: Boolean, default: false }
});

const clientSchema = new Schema({
  clientName: { type: String, required: true },
  companyName: { type: String, required: true },
  email: String,
  contactNumber: { type: String, required: true },
  alternativeNumber: String,
  industry: { type: Schema.Types.ObjectId, ref: 'Industry', required: true },
  about: String,
  website: String,
  server: { type: String, required: true },
  clientSource: { type: Schema.Types.ObjectId, ref: 'ClientSource', required: true },
  branchAddresses: [branchAddressSchema],
  attachments: [attachmentSchema],
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);