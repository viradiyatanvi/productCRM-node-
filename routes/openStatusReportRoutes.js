const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const JobOpenStatus = require('../models/JobOpenStatus');
const { isAuthenticated } = require('../middleware/auth');

// Jobs by Open Status Report
router.get('/jobs-by-status', isAuthenticated , async (req, res) => {
  try {
    // Get all job statuses with their job counts and job details
    const statuses = await JobOpenStatus.aggregate([
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: 'jobOpenStatus',
          as: 'jobs'
        }
      },
      {
        $addFields: {
          jobCount: { $size: '$jobs' },
          activeJobs: {
            $size: {
              $filter: {
                input: '$jobs',
                as: 'job',
                cond: { $eq: ['$$job.status', 'Active'] }
              }
            }
          },
          inactiveJobs: {
            $size: {
              $filter: {
                input: '$jobs',
                as: 'job',
                cond: { $eq: ['$$job.status', 'Inactive'] }
              }
            }
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    // Prepare data for chart
    const chartData = {
      labels: statuses.map(status => status.name),
      datasets: [
        {
          label: 'Total Jobs',
          data: statuses.map(status => status.jobCount),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };

    res.render('report/jobsByStatus', {
      statuses,
      chartData: JSON.stringify(chartData),
      user: req.session.user
    });

  } catch (err) {
    console.error("Error generating jobs by status report:", err);
    res.status(500).render('error', {
      message: "Failed to generate jobs by status report",
      user: req.session.user
    });
  }
});

module.exports = router;