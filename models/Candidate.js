const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({

  institute: { type: String, required: true },
  major: String,
  startMonth: String,
  startYear: String,
  endMonth: String,
  endYear: String,
  currentlyStudying: Boolean
});

const workExperienceSchema = new mongoose.Schema({
  jobTitle: { type: String, required: true },
  category: { type: String, required: true },
  categoryName: String,
  startMonth: String,
  startYear: String,
  endMonth: String,
  endYear: String,
  currentlyWorking: Boolean,
  description: String
});

const candidateSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  confirmPassword: { type: String, required: true },
  fax: String,
  website: String,

  // Address Information
  street: String,
  city: String,
  state: String,
  code: String,
  country: String,

  // Professional Details
  totalExperience: String,
  expectedSalary: String,
  skills: String,
  additionalInfo: String,

  // Other Information
  source: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateSource' },
  status: { type: mongoose.Schema.Types.ObjectId, ref: 'CandidateStatus' },
  sourceContact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
  },
  twitter: String,
  skype: String,

  // Attachments
  resume: String,
  profileImage: String,
  coverLetter: String,
  contract: String,

  // Education and Experience
  educationLevel: String,
  education: [{
    institute: String,
    major: String,
    startMonth: String,
    startYear: String,
    endMonth: String,
    endYear: String,
    currentlyStudying: Boolean
  }],
  workExperiences: [workExperienceSchema],
  summaryPoints: [String]

}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateSchema);