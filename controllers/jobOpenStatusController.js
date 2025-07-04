const JobOpenStatus = require('../models/JobOpenStatus');

exports.listJobOpenStatuses = async (req, res) => {
  try {
    const jobOpenStatuses = await JobOpenStatus.find().sort({ createdAt: -1 });
    res.render('jobOpenStatus/list', {
      jobOpenStatuses,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error fetching job open statuses:", err);
    res.status(500).render('error', {
      message: "Failed to load job open statuses",
      user: req.session.user
    });
  }
};

exports.getAddJobOpenStatusForm = async (req, res) => {
  try {
    res.render('jobOpenStatus/add', {
      error: null,
      user: req.session.user
    });
  } catch (err) {
    console.log("Error rendering add page", err);
    res.render('jobOpenStatus/add', {
      error: "Something went wrong",
      user: req.session.user
    });
  }
};

exports.postAddJobOpenStatus = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.render('jobOpenStatus/add', {
        error: "Name is required",
        user: req.session.user
      });
    }

    await JobOpenStatus.create({ name });
    res.redirect('/job-open-status');
  } catch (err) {
    console.error("Save Error:", err);
    res.render('jobOpenStatus/add', {
      error: "Something went wrong while saving",
      user: req.session.user
    });
  }
};

exports.getEditJobOpenStatusForm = async (req, res) => {
  try {
    const jobOpenStatus = await JobOpenStatus.findById(req.params.id);
    res.render('jobOpenStatus/edit', {
      jobOpenStatus,
      error: null,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error fetching job open status:", err);
    res.redirect('/job-open-status');
  }
};

exports.postEditJobOpenStatus = async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name) {
      const jobOpenStatus = await JobOpenStatus.findById(req.params.id);
      return res.render('jobOpenStatus/edit', {
        jobOpenStatus,
        error: "Name is required",
        user: req.session.user
      });
    }

    await JobOpenStatus.findByIdAndUpdate(req.params.id, {
      name,
      status: status || 'active'
    });
    res.redirect('/job-open-status');
  } catch (err) {
    console.error("Update Error:", err);
    res.render('jobOpenStatus/edit', {
      error: "Something went wrong while updating",
      user: req.session.user
    });
  }
};

exports.deleteJobOpenStatus = async (req, res) => {
  try {
    await JobOpenStatus.findByIdAndDelete(req.params.id);
    req.flash('success', 'Job open status deleted successfully');
    res.redirect('/job-open-status');
  } catch (err) {
    console.error("Delete Error:", err);
    req.flash('error', 'Failed to delete job open status');
    res.redirect('/job-open-status');
  }
};