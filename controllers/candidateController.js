const Candidate = require('../models/Candidate');
const CandidateStatus = require('../models/CandidateStatusModel');
const CandidateSource = require('../models/CandidateSource');
const Contact = require('../models/Contact');

exports.list = async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .populate('status')
      .populate('source')
      .populate('sourceContact')
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
    
    res.render('candidates/add', { 
      statuses, 
      sources,
      contacts,
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
            currentlyWorking: exp.currentlyWorking === 'on'
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
        candidateData.billingStreet = contact.billingStreet;
        candidateData.billingCity = contact.billingCity;
        candidateData.billingState = contact.billingState;
        candidateData.billingCode = contact.billingCode;
        candidateData.billingCountry = contact.billingCountry;
        
        if (!contact.shippingSameAsBilling) {
          candidateData.shippingStreet = contact.shippingStreet;
          candidateData.shippingCity = contact.shippingCity;
          candidateData.shippingState = contact.shippingState;
          candidateData.shippingCode = contact.shippingCode;
          candidateData.shippingCountry = contact.shippingCountry;
        } else {
          candidateData.shippingSameAsBilling = true;
          candidateData.shippingStreet = contact.billingStreet;
          candidateData.shippingCity = contact.billingCity;
          candidateData.shippingState = contact.billingState;
          candidateData.shippingCode = contact.billingCode;
          candidateData.shippingCountry = contact.billingCountry;
        }
      }
    }

    // Validate password match
    if (candidateData.password !== candidateData.confirmPassword) {
      const statuses = await CandidateStatus.find();
      const sources = await CandidateSource.find();
      const contacts = await Contact.find().sort({ firstName: 1 });
      return res.render('candidates/add', { 
        statuses, 
        sources,
        contacts,
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
    res.render('candidates/add', { 
      statuses, 
      sources,
      contacts,
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
    const candidate = await Candidate.findById(req.params.id);
    const statuses = await CandidateStatus.find();
    const sources = await CandidateSource.find();
    const contacts = await Contact.find().sort({ firstName: 1 });
    
    res.render('candidates/edit', { 
      candidate, 
      statuses, 
      sources,
      contacts,
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
        currentlyWorking: exp.currentlyWorking === 'on'
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
        updateData.billingStreet = contact.billingStreet;
        updateData.billingCity = contact.billingCity;
        updateData.billingState = contact.billingState;
        updateData.billingCode = contact.billingCode;
        updateData.billingCountry = contact.billingCountry;
        
        if (!contact.shippingSameAsBilling) {
          updateData.shippingStreet = contact.shippingStreet;
          updateData.shippingCity = contact.shippingCity;
          updateData.shippingState = contact.shippingState;
          updateData.shippingCode = contact.shippingCode;
          updateData.shippingCountry = contact.shippingCountry;
        } else {
          updateData.shippingSameAsBilling = true;
          updateData.shippingStreet = contact.billingStreet;
          updateData.shippingCity = contact.billingCity;
          updateData.shippingState = contact.billingState;
          updateData.shippingCode = contact.billingCode;
          updateData.shippingCountry = contact.billingCountry;
        }
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
      .populate('sourceContact');
    
    res.render('candidates/view', { candidate });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

// API endpoint to fetch contact details
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