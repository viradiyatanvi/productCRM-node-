const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { isAuthenticated, isStaff } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const moment = require('moment');

// List tickets
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.issueType) filter.issueType = req.query.issueType;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

    // Filter by user role
    if (req.session.user.role === 'support') {
      filter.$or = [
        { assignedTo: req.session.user._id },
        { createdBy: req.session.user._id }
      ];
    }

    const tickets = await Ticket.find(filter)
      .populate('customer', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Ticket.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const supportAgents = await User.find({ 
      role: { $in: ['support', 'admin'] },
      isActive: true 
    }).select('name email role');

    res.render('tickets/list', {
      title: 'Support Tickets',
      tickets,
      supportAgents,
      currentPage: page,
      totalPages,
      query: req.query,
      user: req.session.user,
      moment
    });
  } catch (error) {
    console.error('Tickets list error:', error);
    res.status(500).render('error', {
      title: 'Tickets Error',
      error: { message: 'Unable to load tickets' }
    });
  }
});

// Add ticket page
router.get('/add', isStaff, async (req, res) => {
  try {
    const customers = await Customer.find({ isActive: true });
    const supportAgents = await User.find({ 
      role: { $in: ['support', 'admin'] },
      isActive: true 
    }).select('name email role');

    res.render('tickets/add', {
      title: 'Create Support Ticket',
      customers,
      supportAgents,
      error: null,
      formData: {},
      user: req.session.user,
      moment
    });
  } catch (error) {
    console.error('Add ticket page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { message: 'Unable to load add ticket page' }
    });
  }
});

// Add ticket process
router.post('/add', isStaff, [
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('description').notEmpty().trim().withMessage('Description is required'),
  body('customer').notEmpty().withMessage('Customer is required'),
  body('issueType').notEmpty().withMessage('Issue type is required'),
  body('priority').notEmpty().withMessage('Priority is required'),
  body('status').optional().isIn(['open', 'in-progress', 'resolved', 'closed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const customers = await Customer.find({ isActive: true });
      const supportAgents = await User.find({ 
        role: { $in: ['support', 'admin'] },
        isActive: true 
      }).select('name email role');
      
      return res.render('tickets/add', {
        title: 'Create Support Ticket',
        customers,
        supportAgents,
        error: errors.array()[0].msg,
        formData: req.body,
        user: req.session.user,
        moment
      });
    }

    const ticketData = {
      ...req.body,
      createdBy: req.session.user._id,
      status: req.body.status || 'open'
    };

    const ticket = new Ticket(ticketData);
    await ticket.save();

    res.redirect('/tickets?success=Support ticket created successfully');
  } catch (error) {
    console.error('Add ticket error:', error);
    const customers = await Customer.find({ isActive: true });
    const supportAgents = await User.find({ 
      role: { $in: ['support', 'admin'] },
      isActive: true 
    }).select('name email role');
    
    res.render('tickets/add', {
      title: 'Create Support Ticket',
      customers,
      supportAgents,
      error: 'An error occurred while creating ticket',
      formData: req.body,
      user: req.session.user,
      moment
    });
  }
});

// Ticket details
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('resolvedBy', 'name email');

    if (!ticket) {
      return res.status(404).render('error', {
        title: '404',
        error: { message: 'Ticket not found' }
      });
    }

    // Check if user has permission to view this ticket
    if (req.session.user.role === 'support' && 
        ticket.assignedTo?._id.toString() !== req.session.user._id &&
        ticket.createdBy?._id.toString() !== req.session.user._id) {
      return res.status(403).render('error', {
        title: '403',
        error: { message: 'Access denied' }
      });
    }

    res.render('tickets/view', {
      title: `Ticket: ${ticket.ticketNumber}`,
      ticket,
      user: req.session.user,
      moment
    });
  } catch (error) {
    console.error('Ticket details error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { message: 'Unable to load ticket details' }
    });
  }
});

// Update ticket status
router.post('/update-status/:id', isStaff, async (req, res) => {
  try {
    const { status, resolution } = req.body;

    const allowedStatuses = ['open', 'in-progress', 'resolved', 'closed', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Check if user has permission to update this ticket
    if (req.session.user.role === 'support' && 
        ticket.assignedTo?._id.toString() !== req.session.user._id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    ticket.status = status;

    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = new Date();
      ticket.resolvedBy = req.session.user._id;
      if (resolution) ticket.resolution = resolution;
    }

    await ticket.save();
    return res.json({ success: true, message: 'Status updated successfully' });

  } catch (error) {
    console.error('Update ticket status error:', error);
    return res.status(500).json({ success: false, message: 'Server error while updating status' });
  }
});

module.exports = router;