const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { isAuthenticated, isAdminOrSales, isStaff } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const moment=require('moment')

// List leads
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.source) filter.source = req.query.source;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { email: new RegExp(req.query.search, 'i') },
        { phone: new RegExp(req.query.search, 'i') }
      ];
    }

    // Filter by user role
    if (req.session.user.role === 'telecaller') {
      filter.assignedTo = req.session.user._id;
    }

    const leads = await Lead.find(filter)
      .populate('interestedProduct', 'name price')
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Lead.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // assignment filter
    const users = await User.find({ 
      role: { $in: ['telecaller', 'sales'] },
      isActive: true 
    });

    res.render('leads/list', {
      title: 'Leads',
      leads,
      users,
       user: req.session.user,
      currentPage: page,
      totalPages,
      query: req.query,
      moment
    });
  } catch (error) {
    console.error('Leads list error:', error);
    res.status(500).render('error', {
      title: 'Leads Error',
      error: { message: 'Unable to load leads' }
    });
  }
});

// Add lead page
router.get('/add', isStaff, async (req, res) => {
  try {
    const products = await Product.find({ status: 'active' });
    const users = await User.find({ 
      role: { $in: ['telecaller', 'sales'] },
      isActive: true 
    });

    res.render('leads/add', {
      title: 'Add Lead',
      products,
      users,
       user: req.session.user,
      error: null,
      formData: {},
      moment
    });
  } catch (error) {
    console.error('Add lead page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { message: 'Unable to load add lead page' }
    });
  }
});

// Add lead process
router.post('/add', isStaff, [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const products = await Product.find({ status: 'active' });
      const users = await User.find({ 
        role: { $in: ['telecaller', 'sales'] },
        isActive: true 
      });
      
      return res.render('leads/add', {
        title: 'Add Lead',
        products,
        users,
         user: req.session.user,
        error: errors.array()[0].msg,
        formData: req.body,
        moment
      });
    }

    // Check for duplicate email or phone
    const existingLead = await Lead.findOne({
      $or: [
        { email: req.body.email },
        { phone: req.body.phone }
      ]
    });

    if (existingLead) {
      const products = await Product.find({ status: 'active' });
      const users = await User.find({ 
        role: { $in: ['telecaller', 'sales'] },
        isActive: true 
      });
      
      return res.render('leads/add', {
        title: 'Add Lead',
        products,
        users,
         user: req.session.user,
        error: 'Lead with this email or phone already exists',
        formData: req.body,
        moment
      });
    }

    const leadData = {
      ...req.body,
      createdBy: req.session.user._id
    };

    // Auto-assign to creator if they are telecaller
    if (req.session.user.role === 'telecaller' && !leadData.assignedTo) {
      leadData.assignedTo = req.session.user._id;
    }

    const lead = new Lead(leadData);
    await lead.save();

    res.redirect('/leads?success=Lead added successfully');
  } catch (error) {
    console.error('Add lead error:', error);
    const products = await Product.find({ status: 'active' });
    const users = await User.find({ 
      role: { $in: ['telecaller', 'sales'] },
      isActive: true 
    });
    
    res.render('leads/add', {
      title: 'Add Lead',
      products,
      users,
       user: req.session.user,
      error: 'An error occurred while adding lead',
      formData: req.body,
      moment
    });
  }
});

// Edit lead page
router.get('/edit/:id', isStaff, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).render('error', {
        title: '404',
        error: { message: 'Lead not found' }
      });
    }

    // Check if user can edit this lead
    if (req.session.user.role === 'telecaller' && 
        lead.assignedTo.toString() !== req.session.user._id) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        error: { message: 'You can only edit leads assigned to you' }
      });
    }

    const products = await Product.find({ status: 'active' });
    const users = await User.find({ 
      role: { $in: ['telecaller', 'sales'] },
      isActive: true 
    });

    res.render('leads/edit', {
      title: 'Edit Lead',
      lead,
      products,
      users,
       user: req.session.user,
      error: null,
      moment
    });
  } catch (error) {
    console.error('Edit lead page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { message: 'Unable to load lead details' }
    });
  }
});

// Edit lead process
router.post('/edit/:id', isStaff, [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().trim()
], async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).render('error', {
        title: '404',
        error: { message: 'Lead not found' }
      });
    }

    if (req.session.user.role === 'telecaller' &&
        lead.assignedTo?.toString() !== req.session.user._id) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        error: { message: 'You can only edit leads assigned to you' }
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const products = await Product.find({ status: 'active' });
      const users = await User.find({
        role: { $in: ['telecaller', 'sales'] },
        isActive: true
      });

      return res.render('leads/edit', {
        title: 'Edit Lead',
        lead: { ...lead.toObject(), ...req.body },
        products,
        users,
        user: req.session.user,
        error: errors.array()[0].msg,
        moment
      });
    }

    lead.name = req.body.name;
    lead.email = req.body.email;
    lead.phone = req.body.phone;
    lead.city = req.body.city || '';
    lead.status = req.body.status || lead.status;
    lead.priority = req.body.priority || lead.priority;
    lead.source = req.body.source || lead.source;
    lead.notes = req.body.notes || '';

    lead.interestedProduct = req.body.interestedProduct && req.body.interestedProduct !== '' 
      ? req.body.interestedProduct 
      : null;

    if (['admin', 'sales'].includes(req.session.user.role)) {
      lead.assignedTo = req.body.assignedTo && req.body.assignedTo !== '' 
        ? req.body.assignedTo 
        : null;
    }

    await lead.save();

    return res.redirect('/leads?success=Lead updated successfully');
  } catch (error) {
    console.error('Edit lead error:', error);
    return res.redirect('/leads?error=Unable to update lead');
  }
});


// Convert lead to customer
router.post('/convert/:id', isAdminOrSales, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (lead.status === 'converted') {
      return res.status(400).json({ success: false, message: 'Lead already converted' });
    }

    // Create customer from lead
    const customerData = {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      city: lead.city,
      originalLead: lead._id,
      assignedTo: lead.assignedTo,
      createdBy: req.session.user._id
    };

    const customer = new Customer(customerData);
    await customer.save();

    // Update lead status
    lead.status = 'converted';
    lead.convertedAt = new Date();
    await lead.save();

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.json({ success: true, message: 'Lead converted to customer successfully' });
    } else {
      res.redirect('/leads?success=Lead converted to customer successfully');
    }
  } catch (error) {
    console.error('Convert lead error:', error);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.status(500).json({ success: false, message: 'Unable to convert lead' });
    } else {
      res.redirect('/leads?error=Unable to convert lead');
    }
  }
});

// Lead detailsh
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('interestedProduct', 'name price category')
      .populate('assignedTo', 'name role')
      .populate('createdBy', 'name email');

    if (!lead) {
      return res.status(404).render('error', {
        title: '404',
        error: { message: 'Lead not found' }
      });
    }

    // Get follow-up history
    const Followup = require('../models/Followup');
    const followups = await Followup.find({ lead: lead._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.render('leads/view', {
      title: `Lead: ${lead.name}`,
      lead,
      followups,
      moment ,
      user: req.session.user,
    });
  } catch (error) {
    console.error('Lead details error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { message: 'Unable to load lead details' }
    });
  }
});


module.exports = router;