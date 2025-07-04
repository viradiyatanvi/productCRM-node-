const JobType = require('../models/JobType');

exports.listJobTypes = async (req, res) => {
  try {
    const jobTypes = await JobType.find().sort({ createdAt: -1 });
    res.render('jobType/list', {
      jobTypes,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error fetching job types:", err);
    res.status(500).render('error', {
      message: "Failed to load job types",
      user: req.session.user
    });
  }
};

exports.getAddJobTypeForm = async (req, res) => {
  try {
    res.render('jobType/add', {
      error: null,
      user: req.session.user
    });
  } catch (err) {
    console.log("Error rendering add page", err);
    res.render('jobType/add', {
      error: "Something went wrong",
      user: req.session.user
    });
  }
};

exports.postAddJobType = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.render('jobType/add', {
        error: "Name is required",
        user: req.session.user
      });
    }

    await JobType.create({ name });
    res.redirect('/job-type');
  } catch (err) {
    console.error("Save Error:", err);
    res.render('jobType/add', {
      error: "Something went wrong while saving",
      user: req.session.user
    });
  }
};

exports.viewJobType = async (req, res) => {
  try {
    const jobType = await JobType.findById(req.params.id);
    res.render('jobType/view', { 
      jobType,
      user: req.session.user 
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.deleteJobType = async (req, res) => {
  try {
    await JobType.findByIdAndDelete(req.params.id);
    req.flash('success', 'Job type deleted successfully');
    res.redirect('/job-type');
  } catch (err) {
    console.error("Delete Error:", err);
    req.flash('error', 'Failed to delete job type');
    res.redirect('/job-type');
  }
};