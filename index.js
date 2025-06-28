const express = require('express');
const port = 8014;
const app = express();
const path = require('path');
const db = require('./config/db');
const moment = require('moment');
const { isAuthenticated } = require('./middleware/auth');

const session = require('express-session');
const passport = require('passport');

// Setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

app.use(session({
  name: 'LOGIN',
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 }
}));

app.use(passport.initialize());
app.use(passport.session());

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
app.use('/candidate', require('./routes/candidateRoutes'));
app.use('/manager', require('./routes/managerRoutes'));

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
        // No date filter for 'all time'
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

    // Get counts with date filters
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
      recentCustomers // Add this line for recent customers
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
        // .limit(20)
        .populate('interestedProduct'),
      Followup.find(range === 'all' ? { isCompleted: false } : { 
        ...followupDateFilter,
        isCompleted: false 
      })
        .sort({ nextFollowUpDate: 1 })
        // .limit(20)
        .populate('lead user'),
      Contact.find(range === 'all' ? {} : dateFilter)
        .sort({ createdAt: -1 }),
        // .limit(20),
      Quotation.find({ 
        ...(range === 'all' ? {} : dateFilter),
        status: 'draft'
      })
        .sort({ createdAt: -1 })
        // .limit(20)
        .populate('customer'),
      Candidate.find(range === 'all' ? {} : dateFilter)
        .sort({ createdAt: -1 }),
        // .limit(20),
      // Add recent customers query
      Customer.find(range === 'all' ? {} : dateFilter)
        .sort({ createdAt: -1 })
        // .limit(20) 
    ]);

    res.render('dashboard', {
      stats: {
        todayLeads,
        totalCustomers,
        todaySalesAmount: todaySalesAmount[0]?.total || 0,
        todayFollowups,
        totalContacts,
        pendingQuotations
      },
      recentLeads,
      todaysFollowups,
      recentContacts,
      pendingQuotations: pendingQuotationsList,
      newCandidates,
      recentCustomers, 
      query: { range },
      // user: req.user,
       user: req.user || req.session?.user || {},
      moment
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Start server
app.listen(port, (err) => {
  if (err) {
    console.log('server not start');
    return;
  }
  console.log('server is start: ' + port);
});