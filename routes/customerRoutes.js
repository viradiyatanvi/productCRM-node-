const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { isAuthenticated, isStaff } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const moment=require('moment');

// List customers
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { email: new RegExp(req.query.search, 'i') },
        { phone: new RegExp(req.query.search, 'i') }
      ];
    }
    if (req.query.city) filter.city = new RegExp(req.query.city, 'i');
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

    const customers = await Customer.find(filter)
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const users = await User.find({ 
      role: { $in: ['sales', 'support'] },
      isActive: true 
    });

    res.render('customers/list', {
      title: 'Customers',
      customers,
      users,
      user: req.session.user,        
      currentPage: page,
      totalPages,
      query: req.query,
      moment
    });
  } catch (error) {
    console.error('Customers list error:', error);
    res.status(500).render('error', {
      title: 'Customers Error',
      error: { message: 'Unable to load customers' }
    });
  }
});

// Customer details
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('originalLead', 'source createdAt');

    if (!customer) {
      return res.status(404).render('error', {
        title: '404',
        error: { message: 'Customer not found' }
      });
    }

    // Get customer's sales history
    const sales = await Sale.find({ customer: customer._id })
      .populate('products.product', 'name')
      .populate('salesPerson', 'name')
      .sort({ createdAt: -1 });

    // Get customer's support tickets
    const tickets = await Ticket.find({ customer: customer._id })
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });

    // Calculate total purchase amount
    const totalPurchases = sales.reduce((sum, sale) => sum + sale.finalAmount, 0);

    res.render('customers/view', {
      title: `Customer: ${customer.name}`,
      customer,
      sales,
      tickets,
      totalPurchases,
      moment,
      user: req.session.user,
    });
  } catch (error) {
    console.error('Customer details error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { message: 'Unable to load customer details' }
    });
  }
});

// Edit customer page
router.get('/edit/:id', isStaff, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).render('error', {
        title: '404',
        error: { message: 'Customer not found' }
      });
    }

    const users = await User.find({ 
      role: { $in: ['sales', 'support'] },
      isActive: true 
    });

    res.render('customers/edit', {
      title: 'Edit Customer',
      customer,
      users,
      user: req.session.user,
      error: null,
      moment
    });
  } catch (error) {
    console.error('Edit customer page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { message: 'Unable to load customer details' }
    });
  }
});

// Edit customer process
router.post('/edit/:id', isStaff, [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const customer = await Customer.findById(req.params.id);
      const users = await User.find({ 
        role: { $in: ['sales', 'support'] },
        isActive: true 
      });
      
      return res.render('customers/edit', {
        title: 'Edit Customer',
        customer: { ...customer.toObject(), ...req.body }, // javascript object me badalata he value ko spread karta he.
        users,
        user: req.session.user,
        error: errors.array()[0].msg,
        moment
      });
    }

    await Customer.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/customers?success=Customer updated successfully');
  } catch (error) {
    console.error('Edit customer error:', error);
    res.redirect('/customers?error=Unable to update customer');
  }
});

module.exports = router;