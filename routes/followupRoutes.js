const express = require('express');
const router = express.Router();
const Followup = require('../models/Followup');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { isAuthenticated, isStaff } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const moment=require('moment');

// Today followup
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const baseFilter = { // nextfollow aaaj k din ka he
      nextFollowUpDate: { 
        $gte: startOfDay, 
        $lte: endOfDay 
      }
    };

    if (req.session.user.role === 'telecaller') {
      baseFilter.user = req.session.user._id;
    }

    const followups = await Followup.find(baseFilter)
      .populate('lead', 'name email phone city status')
      .populate('user', 'name')
      .sort({ nextFollowUpDate: 1 });

    const pendingCount = followups.filter(f => f.status === 'pending').length;

    res.render('followup/today', {
      title: "Today's Follow-ups",
      followups,
      user: req.session.user,
      pendingCount,
      moment
    });

  } catch (error) {
    console.error('Today followups error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { message: 'Unable to load follow-ups' }
    });
  }
});


// Follow-up history
router.get('/history', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.callStatus = req.query.status;
    if (req.query.user) filter.user = req.query.user;

    // Filter by user role
    if (req.session.user.role === 'telecaller') {
      filter.user = req.session.user._id;
    }

    const followups = await Followup.find(filter)
      .populate('lead', 'name email phone')
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Followup.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const users = await User.find({ 
      role: { $in: ['telecaller', 'sales'] },
      isActive: true 
    });

    res.render('followup/history', {
      title: 'Follow-up History',
      followups,
      users,
      user: req.session.user,
      currentPage: page,
      totalPages,
      query: req.query,
      moment
    });
  } catch (error) {
    console.error('Followup history error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { message: 'Unable to load follow-up history' }
    });
  }
});

// Add follow-up page
router.get('/add', isStaff, async (req, res) => {
  try {
    const leadId = req.query.leadId;
    let lead = null;

    if (leadId) {
      lead = await Lead.findById(leadId);
    }

    const leads = await Lead.find({ 
      status: { $in: ['new', 'contacted', 'interested'] }
    }).select('name email phone');

    res.render('followup/add', {
      title: 'Add Follow-up',
      lead,
      leads,
      error: null,
      formData: {},
      moment,
      user: req.session.user,
    });
  } catch (error) {
    console.error('Add followup page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { message: 'Unable to load add follow-up page' }
    });
  }
});

// Add follow-up process
router.post('/add', isStaff, [
  body('lead').notEmpty(),
  body('callStatus').notEmpty(),
  body('remarks').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const leads = await Lead.find({ 
        status: { $in: ['new', 'contacted', 'interested'] }
      }).select('name email phone');
      
      return res.render('followup/add', {
        title: 'Add Follow-up',
        lead: null,
        leads,
        error: errors.array()[0].msg,
        formData: req.body,
        moment,
        user: req.session.user,
      });
    }

    const followupData = {
      ...req.body,
      user: req.session.user._id
    };

    const followup = new Followup(followupData);
    await followup.save();

    // Update lead status and next follow-up date
    const lead = await Lead.findById(req.body.lead);
    lead.lastContactDate = new Date();
    
    if (req.body.callStatus === 'interested') {
      lead.status = 'interested';
    } else if (req.body.callStatus === 'not-interested') {
      lead.status = 'not-interested';
    } else {
      lead.status = 'contacted';
    }

    if (req.body.nextFollowUpDate) {
      lead.nextFollowUpDate = req.body.nextFollowUpDate;
    }

    await lead.save();

    res.redirect('/followup?success=Follow-up added successfully');
  } catch (error) {
    console.error('Add followup error:', error);
    const leads = await Lead.find({ 
      status: { $in: ['new', 'contacted', 'interested'] } // in tino mese koi hona chahiae
    }).select('name email phone');
    
    res.render('followup/add', {
      title: 'Add Follow-up',
      lead: null,
      leads,
      error: 'An error occurred while adding follow-up',
      formData: req.body,
      moment,
      user: req.session.user,
    });
  }
});

// Mark follow-up as completed
router.post('/complete/:id', isStaff, async (req, res) => {
  try {
    await Followup.findByIdAndUpdate(req.params.id, { isCompleted: true });
    res.redirect('/followup?success=Follow-up marked as completed');
  } catch (error) {
    console.error('Complete followup error:', error);
    res.redirect('/followup?error=Unable to complete follow-up');
  }
});

module.exports = router;