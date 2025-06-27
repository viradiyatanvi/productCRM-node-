const express = require('express');
const port = 8014;
const app = express();
const path = require('path');
const db = require('./config/db');
const moment = require('moment');
const {isAuthenticated} = require('./middleware/auth');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const session = require('express-session'); 
const passport = require('passport');

app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

app.use(session({
    name: 'LOGIN',
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 
    }
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
app.use('/',isAuthenticated,async (req, res) => {
  try {
    const Lead = require('./models/Lead');
    const Customer = require('./models/Customer');
    const Sale = require('./models/Sale');
    const Ticket = require('./models/Ticket');
    const Followup = require('./models/Followup');
    const Product = require('./models/Product');
    const Contact = require('./models/Contact');
    const Quotation = require('./models/Quotation');
    const Candidate = require('./models/Candidate');

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todaySalesAgg = await Sale.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);

    const stats = await Promise.all([
      Lead.countDocuments({ status: { $ne: 'converted' } }),
      Customer.countDocuments(),
      Sale.countDocuments(),
      Ticket.countDocuments({ status: { $in: ['open', 'in-progress'] } }),
      Followup.countDocuments({ nextFollowUpDate: { $gte: startOfDay, $lte: endOfDay }, isCompleted: false }),
      Lead.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      Promise.resolve(todaySalesAgg),
      Contact.countDocuments(),
      Quotation.countDocuments({ status: 'draft' }),
      Candidate.countDocuments({ status: 'new' })
    ]);

    const dashboardData = {
      totalLeads: stats[0],
      totalCustomers: stats[1],
      totalSales: stats[2],
      openTickets: stats[3],
      todayFollowups: stats[4],
      todayLeads: stats[5],
      todaySalesAmount: stats[6][0]?.total || 0,
      totalContacts: stats[7],
      pendingQuotations: stats[8],
      newCandidates: stats[9]
    };

    const recentLeads = await Lead.find()
      .populate('interestedProduct', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const todaysFollowups = await Followup.find({
      nextFollowUpDate: { $gte: startOfDay, $lte: endOfDay },
      isCompleted: false
    })
      .populate('lead', 'name phone')
      .populate('user', 'name')
      .sort({ nextFollowUpDate: 1 })
      .limit(10);

    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const pendingQuotations = await Quotation.find({ status: 'draft' })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const newCandidates = await Candidate.find({ status: 'new' })
      .sort({ createdAt: -1 })
      .limit(5);

    res.render('dashboard', {
      title: 'Dashboard',
      stats: dashboardData,
      recentLeads,
      todaysFollowups,
      recentContacts,
      pendingQuotations,
      newCandidates,
      user: req.user || {},
      query: req.query,
      moment,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('error', {
      title: 'Dashboard Error',
      error: { message: 'Unable to load dashboard data' }
    });
  }
});

app.listen(port, (err) => {
    if(err) {
        console.log('server not start');
        return false;
    }
    console.log('server is start:' + port);
});