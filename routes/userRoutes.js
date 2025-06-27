const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// List users (Admin only)
router.get('/', isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.isActive = req.query.status === 'active';
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { email: new RegExp(req.query.search, 'i') }
      ];
    }

    const users = await User.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.render('users/list', {
      title: 'User Management',
      users,
      currentPage: page,
      totalPages,
      query: req.query
    });
  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).render('error', {
      title: 'Users Error',
      error: { message: 'Unable to load users' }
    });
  }
});

// Add user page
router.get('/add', isAdmin, (req, res) => {
  res.render('users/add', {
    title: 'Add User',
    error: null,
    formData: {}
  });
});

// Add user process
router.post('/add', isAdmin, [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['admin', 'sales', 'telecaller', 'support'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('users/add', {
        title: 'Add User',
        error: errors.array()[0].msg,
        formData: req.body
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.render('users/add', {
        title: 'Add User',
        error: 'User with this email already exists',
        formData: req.body
      });
    }

    const userData = {
      ...req.body,
      createdBy: req.session.user._id
    };

    const user = new User(userData);
    await user.save();

    res.redirect('/users?success=User added successfully');
  } catch (error) {
    console.error('Add user error:', error);
    res.render('users/add', {
      title: 'Add User',
      error: 'An error occurred while adding user',
      formData: req.body
    });
  }
});

// Edit user page
router.get('/edit/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).render('error', {
        title: '404',
        error: { message: 'User not found' }
      });
    }

    res.render('users/edit', {
      title: 'Edit User',
      editUser: user,
      error: null
    });
  } catch (error) {
    console.error('Edit user page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { message: 'Unable to load user details' }
    });
  }
});

// Edit user process
router.post('/edit/:id', isAdmin, [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['admin', 'sales', 'telecaller', 'support'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const user = await User.findById(req.params.id);
      return res.render('users/edit', {
        title: 'Edit User',
        editUser: { ...user.toObject(), ...req.body },
        error: errors.array()[0].msg
      });
    }

    const updateData = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      phone: req.body.phone,
      isActive: req.body.isActive === 'true'
    };

    // Update password only if provided
    if (req.body.password && req.body.password.trim()) {
      updateData.password = req.body.password;
    }

    await User.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/users?success=User updated successfully');
  } catch (error) {
    console.error('Edit user error:', error);
    res.redirect('/users?error=Unable to update user');
  }
});

// Toggle user status
router.post('/toggle-status/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ 
      success: true, 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ success: false, message: 'Unable to update user status' });
  }
});

module.exports = router;