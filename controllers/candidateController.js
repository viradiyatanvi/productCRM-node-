const Candidate = require('../models/Candidate');
const CandidateStatus = require('../models/CandidateStatusModel');
const CandidateSource = require('../models/CandidateSource');
const Contact = require('../models/Contact');
const Job = require('../models/Job');

exports.list = async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .populate('status')
      .populate('source')
      .populate('sourceContact')
      .populate('workExperiences.jobTitle')
      .sort({ createdAt: -1 });
    res.render('candidates/list', { candidates, formData: req.body });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.addForm = async (req, res) => {
  try {
    const statuses = await CandidateStatus.find();
    const sources = await CandidateSource.find();
    const contacts = await Contact.find().sort({ firstName: 1 });
    const jobs = await Job.find({ status: 'active' }).sort({ title: 1 });
    
    res.render('candidates/add', { 
      statuses, 
      sources,
      contacts,
      jobs,
      months: ['January', 'February', 'March', 'April', 'May', 'June', 
              'July', 'August', 'September', 'October', 'November', 'December'],
      currentYear: new Date().getFullYear(),
      formData: req.body || {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.create = async (req, res) => {
  try {
    const files = req.files;
    const candidateData = {
      ...req.body,
      resume: files.resume?.[0]?.filename,
      profileImage: files.profileImage?.[0]?.filename,
      coverLetter: files.coverLetter?.[0]?.filename,
      contract: files.contract?.[0]?.filename
    };

    // Process education array
    if (req.body.education) {
      candidateData.education = Array.isArray(req.body.education) 
        ? req.body.education.map(edu => ({
            ...edu,
            currentlyStudying: edu.currentlyStudying === 'on'
          }))
        : [];
    }

    // Process work experiences array
    if (req.body.workExperiences) {
      candidateData.workExperiences = Array.isArray(req.body.workExperiences)
        ? req.body.workExperiences.map(exp => ({
            ...exp,
            currentlyWorking: exp.currentlyWorking === 'on',
            jobTitle: exp.jobTitle || null
          }))
        : [];
    }

    // Process summary points
    if (req.body.summaryPoints) {
      candidateData.summaryPoints = Array.isArray(req.body.summaryPoints)
        ? req.body.summaryPoints.filter(point => point && point.trim() !== '')
        : [];
    }

    // If sourceContact is selected, populate address data
    if (req.body.sourceContact) {
      const contact = await Contact.findById(req.body.sourceContact);
      if (contact) {
        candidateData.street = contact.billingStreet;
        candidateData.city = contact.billingCity;
        candidateData.state = contact.billingState;
        candidateData.code = contact.billingCode;
        candidateData.country = contact.billingCountry;
      }
    }

    // Validate password match
    if (candidateData.password !== candidateData.confirmPassword) {
      const statuses = await CandidateStatus.find();
      const sources = await CandidateSource.find();
      const contacts = await Contact.find().sort({ firstName: 1 });
      const jobs = await Job.find({ status: 'active' }).sort({ title: 1 });
      return res.render('candidates/add', { 
        statuses, 
        sources,
        contacts,
        jobs,
        error: 'Passwords do not match',
        formData: req.body,
        months: ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'],
        currentYear: new Date().getFullYear()
      });
    }

    const candidate = new Candidate(candidateData);
    await candidate.save();
    req.flash('success', 'Candidate created successfully');
    res.redirect('/candidates');
  } catch (err) {
    console.error(err);
    const statuses = await CandidateStatus.find();
    const sources = await CandidateSource.find();
    const contacts = await Contact.find().sort({ firstName: 1 });
    const jobs = await Job.find({ status: 'active' }).sort({ title: 1 });
    res.render('candidates/add', { 
      statuses, 
      sources,
      contacts,
      jobs,
      error: 'Error creating candidate: ' + err.message,
      formData: req.body,
      months: ['January', 'February', 'March', 'April', 'May', 'June', 
              'July', 'August', 'September', 'October', 'November', 'December'],
      currentYear: new Date().getFullYear()
    });
  }
};

exports.editForm = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('workExperiences.jobTitle');
    const statuses = await CandidateStatus.find();
    const sources = await CandidateSource.find();
    const contacts = await Contact.find().sort({ firstName: 1 });
    const jobs = await Job.find({ status: 'active' }).sort({ title: 1 });
    
    res.render('candidates/edit', { 
      candidate, 
      statuses, 
      sources,
      contacts,
      jobs, 
      months: ['January', 'February', 'March', 'April', 'May', 'June', 
              'July', 'August', 'September', 'October', 'November', 'December'],
      currentYear: new Date().getFullYear()
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.update = async (req, res) => {
  try {
    const files = req.files;
    const updateData = {
      ...req.body
    };

    // Process education array
    if (req.body.education) {
      updateData.education = req.body.education.map(edu => ({
        ...edu,
        currentlyStudying: edu.currentlyStudying === 'on'
      }));
    }

    // Process work experiences array
    if (req.body.workExperiences) {
      updateData.workExperiences = req.body.workExperiences.map(exp => ({
        ...exp,
        currentlyWorking: exp.currentlyWorking === 'on',
        jobTitle: exp.jobTitle || null
      }));
    }

    // Process summary points
    if (req.body.summaryPoints) {
      updateData.summaryPoints = req.body.summaryPoints.filter(point => point.trim() !== '');
    }

    // If sourceContact is selected, populate address data
    if (req.body.sourceContact) {
      const contact = await Contact.findById(req.body.sourceContact);
      if (contact) {
        updateData.street = contact.billingStreet;
        updateData.city = contact.billingCity;
        updateData.state = contact.billingState;
        updateData.code = contact.billingCode;
        updateData.country = contact.billingCountry;
      }
    }

    // Handle file updates
    if (files?.resume) updateData.resume = files.resume[0].filename;
    if (files?.profileImage) updateData.profileImage = files.profileImage[0].filename;
    if (files?.coverLetter) updateData.coverLetter = files.coverLetter[0].filename;
    if (files?.contract) updateData.contract = files.contract[0].filename;

    // Handle file removals
    if (req.body.removeProfileImage === 'on') updateData.profileImage = null;
    if (req.body.removeResume === 'on') updateData.resume = null;
    if (req.body.removeCoverLetter === 'on') updateData.coverLetter = null;
    if (req.body.removeContract === 'on') updateData.contract = null;

    await Candidate.findByIdAndUpdate(req.params.id, updateData);
    req.flash('success', 'Candidate updated successfully');
    res.redirect('/candidates');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error updating candidate');
    res.redirect(`/candidates/edit/${req.params.id}`);
  }
};

exports.delete = async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    req.flash('success', 'Candidate deleted successfully');
    res.redirect('/candidates');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error deleting candidate');
    res.redirect('/candidates');
  }
};

exports.view = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('status')
      .populate('source')
      .populate('sourceContact')
      .populate('workExperiences.jobTitle');
    
    res.render('candidates/view', { candidate });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.getContactDetails = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};