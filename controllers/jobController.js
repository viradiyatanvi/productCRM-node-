const Job = require('../models/Job');
const Client = require('../models/Client');
const Industry = require('../models/Industry');
const JobType = require('../models/JobType');
const JobOpenStatus = require('../models/JobOpenStatus');
const fs = require('fs');
const path = require('path');

// List all jobs    
exports.listJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .populate('client', 'clientName')
      .populate('jobOpenStatus', 'name')
      .sort({ createdAt: -1 });
    
    res.render('job/list', {
      jobs,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).render('error', {
      message: "Failed to load jobs",
      user: req.session.user
    });
  }
};

// Show add job form
exports.getAddJobForm = async (req, res) => {
  try {
    const clients = await Client.find({ status: 'Active' }).sort({ clientName: 1 });
    const industries = await Industry.find({ status: 'active' }).sort({ name: 1 });
    const jobTypes = await JobType.find({ status: 'active' }).sort({ name: 1 });
    const jobOpenStatuses = await JobOpenStatus.find({ status: 'active' }).sort({ name: 1 });
    
    res.render('job/add', {
      clients,
      industries,
      jobTypes,
      jobOpenStatuses,
      error: null,
      user: req.session.user
    });
  } catch (err) {
    console.log("Error rendering add page", err);
    res.render('job/add', {
      clients: [],
      industries: [],
      jobTypes: [],
      jobOpenStatuses: [],
      error: "Something went wrong",
      user: req.session.user
    });
  }
};

// Create new job
exports.postAddJob = async (req, res) => {
  try {
    const {
      title,
      client,
      publishDate,
      industry,
      jobOpenStatus,
      maxExperience,
      maxSalary,
      totalVacancy,
      applicationDeadline,
      jobType,
      minExperience,
      minSalary,
      currency,
      street,
      city,
      state,
      country,
      postalCode,
      rolesResponsibility,
      jobRequirements,
      additionalRequirements,
      benefits,
      applyInstructions
    } = req.body;

    // Basic validation
    if (!title || !client || !industry || !jobOpenStatus || !jobType) {
      const clients = await Client.find({ status: 'Active' }).sort({ clientName: 1 });
      const industries = await Industry.find({ status: 'active' }).sort({ name: 1 });
      const jobTypes = await JobType.find({ status: 'active' }).sort({ name: 1 });
      const jobOpenStatuses = await JobOpenStatus.find({ status: 'active' }).sort({ name: 1 });
      
      return res.render('job/add', {
        clients,
        industries,
        jobTypes,
        jobOpenStatuses,
        error: "Required fields are missing",
        user: req.session.user
      });
    }

    const jobData = {
      title,
      client,
      publishDate,
      industry,
      jobOpenStatus,
      maxExperience,
      maxSalary,
      totalVacancy,
      applicationDeadline,
      jobType,
      minExperience,
      minSalary,
      currency,
      address: {
        street,
        city,
        state,
        country,
        postalCode
      },
      description: {
        rolesResponsibility,
        jobRequirements,
        additionalRequirements,
        benefits,
        applyInstructions
      }
    };

    // Handle file attachments
    if (req.files && req.files.length > 0) {
      jobData.attachments = req.files.map(file => ({
        filename: file.originalname,
        path: file.path
      }));
    }

    await Job.create(jobData);
    req.flash('success', 'Job created successfully');
    res.redirect('/job');
  } catch (err) {
    console.error("Save Error:", err);
    const clients = await Client.find({ status: 'Active' }).sort({ clientName: 1 });
    const industries = await Industry.find({ status: 'active' }).sort({ name: 1 });
    const jobTypes = await JobType.find({ status: 'active' }).sort({ name: 1 });
    const jobOpenStatuses = await JobOpenStatus.find({ status: 'active' }).sort({ name: 1 });
    
    res.render('job/add', {
      clients,
      industries,
      jobTypes,
      jobOpenStatuses,
      error: "Something went wrong while saving",
      user: req.session.user
    });
  }
};

// View single job
exports.viewJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('client')
      .populate('industry')
      .populate('jobType')
      .populate('jobOpenStatus');
    
    if (!job) {
      req.flash('error', 'Job not found');
      return res.redirect('/job');
    }

    res.render('job/view', {
      job,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error fetching job:", err);
    req.flash('error', 'Failed to load job details');
    res.redirect('/job');
  }
};

// Show edit job form
exports.getEditJobForm = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      req.flash('error', 'Job not found');
      return res.redirect('/job');
    }

    const clients = await Client.find({ status: 'Active' }).sort({ clientName: 1 });
    const industries = await Industry.find({ status: 'active' }).sort({ name: 1 });
    const jobTypes = await JobType.find({ status: 'active' }).sort({ name: 1 });
    const jobOpenStatuses = await JobOpenStatus.find({ status: 'active' }).sort({ name: 1 });
    
    res.render('job/edit', {
      job,
      clients,
      industries,
      jobTypes,
      jobOpenStatuses,
      error: null,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error rendering edit form:", err);
    req.flash('error', 'Failed to load edit form');
    res.redirect('/job');
  }
};

// Update job
exports.postEditJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      req.flash('error', 'Job not found');
      return res.redirect('/job');
    }

    const {
      title,
      client,
      publishDate,
      industry,
      jobOpenStatus,
      maxExperience,
      maxSalary,
      totalVacancy,
      applicationDeadline,
      jobType,
      minExperience,
      minSalary,
      currency,
      street,
      city,
      state,
      country,
      postalCode,
      rolesResponsibility,
      jobRequirements,
      additionalRequirements,
      benefits,
      applyInstructions
    } = req.body;

    // Basic validation
    if (!title || !client || !industry || !jobOpenStatus || !jobType) {
      const clients = await Client.find({ status: 'Active' }).sort({ clientName: 1 });
      const industries = await Industry.find({ status: 'active' }).sort({ name: 1 });
      const jobTypes = await JobType.find({ status: 'active' }).sort({ name: 1 });
      const jobOpenStatuses = await JobOpenStatus.find({ status: 'active' }).sort({ name: 1 });
      
      return res.render('job/edit', {
        job,
        clients,
        industries,
        jobTypes,
        jobOpenStatuses,
        error: "Required fields are missing",
        user: req.session.user
      });
    }

    // Update job data
    job.title = title;
    job.client = client;
    job.publishDate = publishDate;
    job.industry = industry;
    job.jobOpenStatus = jobOpenStatus;
    job.maxExperience = maxExperience;
    job.maxSalary = maxSalary;
    job.totalVacancy = totalVacancy;
    job.applicationDeadline = applicationDeadline;
    job.jobType = jobType;
    job.minExperience = minExperience;
    job.minSalary = minSalary;
    job.currency = currency;
    
    job.address = {
      street,
      city,
      state,
      country,
      postalCode
    };
    
    job.description = {
      rolesResponsibility,
      jobRequirements,
      additionalRequirements,
      benefits,
      applyInstructions
    };

    // Handle new file attachments
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        filename: file.originalname,
        path: file.path
      }));
      job.attachments = [...job.attachments, ...newAttachments];
    }

    await job.save();
    req.flash('success', 'Job updated successfully');
    res.redirect(`/job/view/${job._id}`);
  } catch (err) {
    console.error("Update Error:", err);
    const clients = await Client.find({ status: 'Active' }).sort({ clientName: 1 });
    const industries = await Industry.find({ status: 'active' }).sort({ name: 1 });
    const jobTypes = await JobType.find({ status: 'active' }).sort({ name: 1 });
    const jobOpenStatuses = await JobOpenStatus.find({ status: 'active' }).sort({ name: 1 });
    
    res.render('job/edit', {
      job: req.body,
      clients,
      industries,
      jobTypes,
      jobOpenStatuses,
      error: "Something went wrong while updating",
      user: req.session.user
    });
  }
};

// Delete job
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      req.flash('error', 'Job not found');
      return res.redirect('/job');
    }

    // Delete associated attachment files
    if (job.attachments && job.attachments.length > 0) {
      job.attachments.forEach(attachment => {
        if (fs.existsSync(attachment.path)) {
          fs.unlinkSync(attachment.path);
        }
      });
    }

    await Job.findByIdAndDelete(req.params.id);
    req.flash('success', 'Job deleted successfully');
    res.redirect('/job');
  } catch (err) {
    console.error("Delete Error:", err);
    req.flash('error', 'Failed to delete job');
    res.redirect('/job');
  }
};

// Utility function to delete attachment
exports.deleteAttachment = async (req, res) => {
  try {
    const { jobId, attachmentId } = req.params;
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const attachment = job.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    // Delete the file from filesystem
    if (fs.existsSync(attachment.path)) {
      fs.unlinkSync(attachment.path);
    }

    // Remove the attachment from the array
    job.attachments.pull(attachmentId);
    await job.save();

    res.json({ success: true, message: 'Attachment deleted successfully' });
  } catch (err) {
    console.error("Error deleting attachment:", err);
    res.status(500).json({ success: false, message: 'Failed to delete attachment' });
  }
};