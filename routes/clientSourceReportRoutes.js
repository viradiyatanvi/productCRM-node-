const express = require('express');
const router = express.Router();
const ClientSource = require('../models/ClientSource');
const { isAuthenticated } = require('../middleware/auth');

router.get('/clients-by-source', isAuthenticated ,async (req, res) => {
  try {
    const sources = await ClientSource.aggregate([ // aggregation pipeline chalati he
      {
        $lookup: { // clientSource ko client k sath jodata he
          from: 'clients',
          localField: '_id', // current sorce ki id
          foreignField: 'clientSource',
          as: 'clients' // result me aek array banata he
        }
      },
      {
        $addFields: { 
          clientCount: { $size: '$clients' }, //  total client
          activeClients: {
            $size: {
              $filter: {
                input: '$clients',
                as: 'client',
                cond: { $eq: ['$$client.status', 'Active'] }
              }
            }
          },
          inactiveClients: {
            $size: {
              $filter: {
                input: '$clients',
                as: 'client',
                cond: { $eq: ['$$client.status', 'Inactive'] }
              }
            }
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    // Prepare data for chart
    const chartData = {
      labels: sources.map(source => source.name), 
      datasets: [
        {
          label: 'Total Clients', // source k name
          data: sources.map(source => source.clientCount), // dataset
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Active Clients',
          data: sources.map(source => source.activeClients),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Inactive Clients',
          data: sources.map(source => source.inactiveClients),
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }
      ]
    };

    res.render('report/clientsBySource', {
      sources,
      chartData: JSON.stringify(chartData), // json formate me chart ka data
      user: req.session.user  // total user
    });

  } catch (err) {
    console.error("Error generating clients by source report:", err);
    res.status(500).render('error', {
      message: "Failed to generate clients by source report",
      user: req.session.user
    });
  }
});

module.exports = router;