const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Industry = require('../models/Industry');
const { isAuthenticated } = require('../middleware/auth');

// Jobs by Industry Report
router.get('/jobs-by-industry', isAuthenticated , async (req, res) => {
  try {
    const industries = await Industry.aggregate([
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: 'industry',
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
      labels: industries.map(ind => ind.name),
      datasets: [
        {
          label: 'Total Jobs',
          data: industries.map(ind => ind.jobCount),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
      ]
    };

    res.render('report/jobsByIndustry', {
      industries,
      chartData: JSON.stringify(chartData),
      user: req.session.user
    });

  } catch (err) {
    console.error("Error generating jobs by industry report:", err);
    res.status(500).render('error', {
      message: "Failed to generate jobs by industry report",
      user: req.session.user
    });
  }
});

module.exports = router;