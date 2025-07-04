const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Industry = require('../models/Industry');
const { isAuthenticated } = require('../middleware/auth');

router.get('/clients-by-industry', isAuthenticated , async (req, res) => {
  try {
    const industries = await Industry.aggregate([
      {
        $lookup: {
          from: 'clients',
          localField: '_id',
          foreignField: 'industry',
          as: 'clients'
        }
      },
      {
        $addFields: {
          clientCount: { $size: '$clients' }
        }
      },
      { $sort: { name: 1 } }
    ]);

    // Prepare data for chart
    const chartData = {
      labels: industries.map(ind => ind.name),
      datasets: [{
        label: 'Number of Clients',
        data: industries.map(ind => ind.clientCount),
        backgroundColor: industries.map((_, i) => 
          `hsl(${(i * 360 / industries.length)}, 70%, 50%)`),
        borderWidth: 1
      }]
    };

    res.render('report/clientsByIndustry', {
      industries,
      chartData: JSON.stringify(chartData),
      user: req.session.user
    });

  } catch (err) {
    console.error("Error generating report:", err);
    res.status(500).render('error', {
      message: "Failed to generate report",
      user: req.session.user
    });
  }
});

module.exports = router;