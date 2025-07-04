const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const JobType = require('../models/JobType');
const { isAuthenticated } = require('../middleware/auth');

// Jobs by Type Report
router.get('/jobs-by-type', isAuthenticated , async (req, res) => {
  try {
    // Get all job types with their job counts and job details
    const jobTypes = await JobType.aggregate([
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: 'jobType',
          as: 'jobs'
        }
      },
      {
        $addFields: {
          jobCount: { $size: '$jobs' },
          openJobs: {
            $size: {
              $filter: {
                input: '$jobs',
                as: 'job',
                cond: { $eq: ['$$job.status', 'Open'] }
              }
            }
          },
          closedJobs: {
            $size: {
              $filter: {
                input: '$jobs',
                as: 'job',
                cond: { $eq: ['$$job.status', 'Closed'] }
              }
            }
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    // Prepare data for chart
    const chartData = {
      labels: jobTypes.map(type => type.name),
      datasets: [
        {
          label: 'Total Jobs',
          data: jobTypes.map(type => type.jobCount),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };

    res.render('report/jobsByType', {
      jobTypes,
      chartData: JSON.stringify(chartData),
      user: req.session.user
    });

  } catch (err) {
    console.error("Error generating jobs by type report:", err);
    res.status(500).render('error', {
      message: "Failed to generate jobs by type report",
      user: req.session.user
    });
  }
});

module.exports = router;