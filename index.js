const express = require('express');
const port = 8014;
const app = express();
const path = require('path');
const db = require('./config/db');
const moment = require('moment');
const { isAuthenticated } = require('./middleware/auth');

const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const methodOverride = require('method-override');

// Setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout/layout');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(methodOverride('_method'));

app.use(session({
  name: 'LOGIN',
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/products', require('./routes/productRoutes'));
app.use('/leads', require('./routes/leadRoutes'));
app.use('/followup', require('./routes/followupRoutes'));
app.use('/customers', require('./routes/customerRoutes'));
app.use('/sales', require('./routes/salesRoutes'));
app.use('/tickets', require('./routes/ticketRoutes'));
app.use('/quotations', require('./routes/quotationRoutes'));
app.use('/contact', require('./routes/contactRoutes'));
app.use('/candidates', require('./routes/candidateRoutes'));
app.use('/manager', require('./routes/managerRoutes'));
app.use('/candidate/status',require('./routes/candidateStatusRoutes'));
app.use('/candidate/source',require('./routes/candidateSourceRoutes'));
app.use('/note/notetype',require('./routes/noteTypeRoutes'));
app.use('/note',require('./routes/noteRoutes'));
app.use('/client/cientSource',require('./routes/clientSourceRoutes'));
app.use('/industries',require('./routes/industryRoutes'));
app.use('/clients',require('./routes/clientRoutes'));
app.use('/job-type',require('./routes/jobTypeRoutes'));
app.use('/job-open-status',require('./routes/jobOpenStatusRoutes'));
app.use('/job',require('./routes/jobRoutes'));
app.use('/reports', require('./routes/reportRoutes'));
app.use('/reports',require('./routes/jobIndstryRoutes'));
app.use('/reports',require('./routes/typeReportRoutes'));
app.use('/reports',require('./routes/openStatusReportRoutes'));
app.use('/reports',require('./routes/clientSourceReportRoutes'));
// Dashboard Route
app.get('/', isAuthenticated, async (req, res) => {
  try {
    const Lead = require('./models/Lead');
    const Customer = require('./models/Customer');
    const Sale = require('./models/Sale');
    const Followup = require('./models/Followup');
    const Contact = require('./models/Contact');
    const Quotation = require('./models/Quotation');
    const Candidate = require('./models/Candidate');

    // Date range handling
    const range = req.query.range || 'today';
    let dateFilter = {};
    let followupDateFilter = {};

    switch (range) {
      case 'week':
        dateFilter = { 
          createdAt: { 
            $gte: moment().startOf('week').toDate(),
            $lte: moment().endOf('week').toDate()
          }
        };
        followupDateFilter = {
          nextFollowUpDate: {
            $gte: moment().startOf('week').toDate(),
            $lte: moment().endOf('week').toDate()
          }
        };
        break;
      case 'month':
        dateFilter = {
          createdAt: {
            $gte: moment().startOf('month').toDate(),
            $lte: moment().endOf('month').toDate()
          }
        };
        followupDateFilter = {
          nextFollowUpDate: {
            $gte: moment().startOf('month').toDate(),
            $lte: moment().endOf('month').toDate()
          }
        };
        break;
      case 'all':
        // all time
        break;
      case 'today':
      default:
        dateFilter = { 
          createdAt: { 
            $gte: moment().startOf('day').toDate(),
            $lte: moment().endOf('day').toDate()
          }
        };
        followupDateFilter = {
          nextFollowUpDate: {
            $gte: moment().startOf('day').toDate(),
            $lte: moment().endOf('day').toDate()
          }
        };
    }

    const [
      todayLeads,
      totalCustomers,
      todaySalesAmount,
      todayFollowups,
      totalContacts,
      pendingQuotations,
      recentLeads,
      todaysFollowups,
      recentContacts,
      pendingQuotationsList,
      newCandidates,
      recentCustomers
    ] = await Promise.all([
      // Counts with date filters
      Lead.countDocuments(range === 'all' ? {} : dateFilter),
      Customer.countDocuments(range === 'all' ? {} : dateFilter),
      Sale.aggregate([
        {
          $match: range === 'all' ? {} : dateFilter
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$finalAmount" }
          }
        }
      ]),
      Followup.countDocuments(range === 'all' ? { isCompleted: false } : { 
        ...followupDateFilter,
        isCompleted: false 
      }),
      Contact.countDocuments(range === 'all' ? {} : dateFilter),
      Quotation.countDocuments({ 
        ...(range === 'all' ? {} : dateFilter),
        status: 'draft' 
      }),
      
      // Recent data with limits
      Lead.find(range === 'all' ? {} : dateFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('interestedProduct'),
      Followup.find(range === 'all' ? { isCompleted: false } : { 
        ...followupDateFilter,
        isCompleted: false 
      })
        .sort({ nextFollowUpDate: 1 })
        .limit(10)
        .populate('lead user'),
      Contact.find(range === 'all' ? {} : dateFilter)
        .sort({ createdAt: -1 })
        .limit(10),
      Quotation.find({ 
        ...(range === 'all' ? {} : dateFilter),
        status: 'draft'
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('customer'),
      Candidate.find(range === 'all' ? {} : dateFilter)
        .sort({ createdAt: -1 })
        .limit(10),
      // Add recent customers query
      Customer.find(range === 'all' ? {} : dateFilter)
        .sort({ createdAt: -1 })
        .limit(10) 
    ]);

    // Generate chart data
    const chartData = await generateChartData(range);

    res.render('dashboard', {
      stats: {
        todayLeads,
        totalCustomers,
        todaySalesAmount: todaySalesAmount[0]?.total || 0,
        todayFollowups,
        totalContacts,
        pendingQuotations,
        chartData
      },
      recentLeads,
      todaysFollowups,
      recentContacts,
      pendingQuotations: pendingQuotationsList,
      newCandidates,
      recentCustomers, 
      query: { range },
      user: req.user || req.session?.user || {},
      moment
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Function to generate chart data
async function generateChartData(range) {
  const Lead = require('./models/Lead');
  const Customer = require('./models/Customer');
  const Sale = require('./models/Sale');
  const Followup = require('./models/Followup');

  let chartData = {};
  
  try {
    // Sales Trend Data (Last 7 days/weeks/months based on range)
    const salesTrendData = await generateSalesTrendData(range);
    chartData.salesTrend = salesTrendData;

    // Lead Status Distribution
    const leadStatusData = await Lead.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    chartData.leadStatus = {
      labels: leadStatusData.map(item => {
        const statusMap = {
          'new': 'New',
          'interested': 'Interested',
          'contacted': 'Contacted',
          'qualified': 'Qualified',
          'closed': 'Closed'
        };
        return statusMap[item._id] || item._id;
      }),
      data: leadStatusData.map(item => item.count)
    };

    // Monthly Performance (Last 6 months)
    const monthlyPerformanceData = await generateMonthlyPerformanceData();
    chartData.monthlyPerformance = monthlyPerformanceData;

    // Follow-up Trends
    const followupTrendData = await generateFollowupTrendData(range);
    chartData.followupTrend = followupTrendData;

  } catch (error) {
    console.error('Error generating chart data:', error);
    // Return default empty chart data
    chartData = {
      salesTrend: {
        labels: [],
        salesData: [],
        leadsData: []
      },
      leadStatus: {
        labels: [],
        data: []
      },
      monthlyPerformance: {
        labels: [],
        leads: [],
        customers: [],
        sales: []
      },
      followupTrend: {
        labels: [],
        scheduled: [],
        completed: []
      }
    };
  }

  return chartData;
}

async function generateSalesTrendData(range) {
  const Sale = require('./models/Sale');
  const Lead = require('./models/Lead');
  
  let days = 7;
  let groupFormat = '%Y-%m-%d';
  let momentFormat = 'MMM DD';
  
  if (range === 'month') {
    days = 30;
  } else if (range === 'all') {
    days = 12;
    groupFormat = '%Y-%m';
    momentFormat = 'MMM YYYY';
  }

  const labels = [];
  const salesData = [];
  const leadsData = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = moment().subtract(i, range === 'all' ? 'months' : 'days');
    labels.push(date.format(momentFormat));

    const startDate = range === 'all' ? 
      date.startOf('month').toDate() : 
      date.startOf('day').toDate();
    const endDate = range === 'all' ? 
      date.endOf('month').toDate() : 
      date.endOf('day').toDate();

    // Get sales data
    const salesResult = await Sale.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$finalAmount' }
        }
      }
    ]);

    // Get leads data
    const leadsCount = await Lead.countDocuments({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    });

    salesData.push(salesResult[0]?.total || 0);
    leadsData.push(leadsCount);
  }

  return {
    labels,
    salesData,
    leadsData
  };
}

async function generateMonthlyPerformanceData() {
  const Lead = require('./models/Lead');
  const Customer = require('./models/Customer');
  const Sale = require('./models/Sale');

  const labels = [];
  const leads = [];
  const customers = [];
  const sales = [];

  for (let i = 5; i >= 0; i--) {
    const date = moment().subtract(i, 'months');
    labels.push(date.format('MMM YYYY'));

    const startDate = date.startOf('month').toDate();
    const endDate = date.endOf('month').toDate();

    const [leadsCount, customersCount, salesCount] = await Promise.all([
      Lead.countDocuments({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }),
      Customer.countDocuments({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }),
      Sale.countDocuments({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      })
    ]);

    leads.push(leadsCount);
    customers.push(customersCount);
    sales.push(salesCount);
  }

  return {
    labels,
    leads,
    customers,
    sales
  };
}

async function generateFollowupTrendData(range) {
  const Followup = require('./models/Followup');
  
  let days = 7;
  let momentFormat = 'MMM DD';
  
  if (range === 'month') {
    days = 30;
  } else if (range === 'all') {
    days = 12;
    momentFormat = 'MMM YYYY';
  }

  const labels = [];
  const scheduled = [];
  const completed = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = moment().subtract(i, range === 'all' ? 'months' : 'days');
    labels.push(date.format(momentFormat));

    const startDate = range === 'all' ? 
      date.startOf('month').toDate() : 
      date.startOf('day').toDate();
    const endDate = range === 'all' ? 
      date.endOf('month').toDate() : 
      date.endOf('day').toDate();

    const [scheduledCount, completedCount] = await Promise.all([
      Followup.countDocuments({
        nextFollowUpDate: {
          $gte: startDate,
          $lte: endDate
        }
      }),
      Followup.countDocuments({
        nextFollowUpDate: {
          $gte: startDate,
          $lte: endDate
        },
        isCompleted: true
      })
    ]);

    scheduled.push(scheduledCount);
    completed.push(completedCount);
  }

  return {
    labels,
    scheduled,
    completed
  };
}

// Start server
app.listen(port, (err) => {
  if (err) {
    console.log('server not start');
    return;
  }
  console.log('server is start: ' + port);
});