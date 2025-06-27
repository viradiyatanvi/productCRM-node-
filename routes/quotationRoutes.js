const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const User = require('../models/User');
const { isAuthenticated, isAdminOrSales } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const moment = require('moment');

// List quotations
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.customer) filter.customer = req.query.customer;
    if (req.query.createdBy) filter.createdBy = req.query.createdBy;
    if (req.query.dateFrom || req.query.dateTo) {
      filter.createdAt = {};
      if (req.query.dateFrom) filter.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.createdAt.$lte = new Date(req.query.dateTo);
    }

    // Filter by user role
    if (req.session.user.role === 'sales') {
      filter.createdBy = req.session.user._id;
    }

    const quotations = await Quotation.find(filter)
      .populate('customer', 'name email phone')
      .populate('products.product', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Quotation.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Get customers and users for filters
    const customers = await Customer.find({ isActive: true }).select('name email');
    const users = await User.find({ 
      role: { $in: ['admin', 'sales'] },
      isActive: true 
    });

    res.render('quotations/list', {
      title: 'Quotations',
      quotations,
      customers,
      users,
       user: req.session.user,
      currentPage: page,
      totalPages,
      query: req.query,
      moment
    });
  } catch (error) {
    console.error('Quotations list error:', error);
    res.status(500).render('error', {
      title: 'Quotations Error',
       user: req.session.user,
      error: { message: 'Unable to load quotations' }
    });
  }
});

// Add quotation page
router.get('/add', isAdminOrSales, async (req, res) => {
  try {
    const customers = await Customer.find({ isActive: true });
    const leads = await Lead.find({ status: { $in: ['interested', 'contacted'] } });
    const products = await Product.find({ status: 'active' });

    res.render('quotations/add', {
      title: 'Create Quotation',
      customers,
      leads,
      products,
      error: null,
      formData: {},
       user: req.session.user,
       moment
    });
  } catch (error) {
    console.error('Add quotation page error:', error);
    res.status(500).send("Unable to load quotation form: " + error.message);
  }
});

// Add quotation process

router.post('/add', isAdminOrSales, [
  body('customer').notEmpty().withMessage('Customer is required'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
  body('finalAmount').isFloat({ min: 0 }).withMessage('Final amount must be a positive number'),
  body('validUntil').isISO8601().withMessage('Valid until date is invalid'),
], async (req, res) => {
  try {
    const errors = validationResult(req);

    // Parse products array
    let rawProducts = [];
    const bodyProducts = req.body.products;
    if (Array.isArray(bodyProducts)) {
      for (let p of bodyProducts) {
        if (typeof p === 'string') {
          const parsed = JSON.parse(p);
          rawProducts.push(...(Array.isArray(parsed) ? parsed : [parsed]));
        } else if (typeof p === 'object') {
          rawProducts.push(p);
        }
      }
    } else if (typeof bodyProducts === 'string') {
      const parsed = JSON.parse(bodyProducts);
      rawProducts = Array.isArray(parsed) ? parsed : [parsed];
    }

    // Remove duplicates
    const seen = new Set();
    rawProducts = rawProducts.filter(item => {
      const pid = item.product;
      if (!pid || seen.has(pid)) return false;
      seen.add(pid);
      return true;
    });

    // Validate product list
    if (!Array.isArray(rawProducts) || rawProducts.length === 0 ||
        !rawProducts.every(p => p.product && p.quantity > 0)) {
      throw new Error('At least one product with quantity is required');
    }
    if (!errors.isEmpty()) {
      throw new Error(errors.array()[0].msg);
    }

    const latest = await Quotation.findOne().sort({ createdAt: -1 });
    let quotationNumber = 'Q-1001';
    if (latest && latest.quotationNumber) {
      const parts = latest.quotationNumber.split('-');
      const num = parseInt(parts[1], 10);
      if (!isNaN(num)) {
        quotationNumber = `Q-${num + 1}`;
      }
    }

    const quotation = new Quotation({
      quotationNumber,
      customer: req.body.customer,
      lead: req.body.lead || null,
      products: rawProducts,
      totalAmount: req.body.totalAmount,
      finalAmount: req.body.finalAmount,
      discount: req.body.discount || 0,
      tax: req.body.tax || 0,
      validUntil: req.body.validUntil,
      terms: req.body.terms,
      notes: req.body.notes,
      createdBy: req.session.user._id,
      status: req.body.status || 'draft'
    });
    await quotation.save();

    return res.redirect('/quotations?success=Quotation created successfully');
  } catch (err) {
    console.error('Add quotation error:', err);
    const [customers, leads, products] = await Promise.all([
      Customer.find({ isActive: true }),
      Lead.find({ status: { $in: ['interested', 'contacted'] } }),
      Product.find({ status: 'active' })
    ]);
    return res.render('quotations/add', {
      title: 'Create Quotation',
      customers, leads, products,
      error: err.message,
      formData: req.body,
      user: req.session.user,
      moment
    });
  }
});

// Quotation details
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const quotation = await Quotation.findById(id)
      .populate('customer', 'name email phone address')
      .populate('products.product', 'name category')
      .populate('createdBy', 'name email');

    if (!quotation) {
      return res.status(404).render('error', {
        title: 'Quotation Not Found',
        error: { message: 'Quotation not found with this ID' }
      });
    }

    // Status display helper
    quotation.getStatusDisplay = function () {
      const map = { draft: 'Draft', sent: 'Sent' };
      return map[this.status] || this.status;
    };

    res.render('quotations/view', {
      title: `Quotation - ${quotation._id}`, // quotation ko display karta he
      quotation,
      moment,
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Server Error',
      error: { message: 'Internal Server Error' }
    });
  }
});


// Update quotation status
router.post('/update-status/:id', isAdminOrSales, async (req, res) => {
  try {
    const { status } = req.body;
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const updateData = { status };

    if (status === 'sent') {
      updateData.sentAt = new Date();
    } else if (status === 'accepted') {
      updateData.acceptedAt = new Date();
    }

    await Quotation.findByIdAndUpdate(req.params.id, updateData);

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.json({ success: true, message: 'Quotation status updated successfully' });
    } else {
      res.redirect('/quotations?success=Quotation status updated successfully');
    }
  } catch (error) {
    console.error('Update quotation status error:', error);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.status(500).json({ success: false, message: 'Unable to update quotation status' });
    } else {
      res.redirect('/quotations?error=Unable to update quotation status');
    }
  }
});

// Convert Quotation to Sale
router.post('/convert/:id', isAdminOrSales, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customer')
      .populate('products.product');

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    if (quotation.status === 'converted') {
      return res.status(400).json({ success: false, message: 'Quotation already converted' });
    }

    if (quotation.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Only accepted quotations can be converted' });
    }

    // Validate product stock before converting
    for (const item of quotation.products) {
      const dbProduct = await Product.findById(item.product._id);
      if (!dbProduct || dbProduct.stockQuantity < item.quantity) { // product pr quantity hoti he
        return res.status(400).json({
          success: false,
          message: `Not enough stock for product: ${item.product.name}`
        });
      }
    }

    // Create sale from quotation
    const saleData = {
      customer: quotation.customer._id,
      products: quotation.products,
      totalAmount: quotation.totalAmount,
      discount: quotation.discount,
      tax: quotation.tax,
      finalAmount: quotation.finalAmount,
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      salesPerson: quotation.createdBy,
      notes: `Converted from quotation: ${quotation.quotationNumber}`
    };

    const sale = new Sale(saleData);
    await sale.save();

    // Update product stock
    for (const item of quotation.products) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stockQuantity: -item.quantity }
      });
    }

    quotation.status = 'converted';
    quotation.convertedSale = sale._id;
    await quotation.save();

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.json({ success: true, message: 'Quotation converted to sale successfully', saleId: sale._id });
    } else {
      res.redirect('/quotations?success=Quotation converted to sale successfully');
    }
  } catch (error) {
    console.error('Convert quotation error:', error);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      res.status(500).json({ success: false, message: 'Unable to convert quotation' });
    } else {
      res.redirect('/quotations?error=Unable to convert quotation');
    }
  }
});

// Delete quotation
router.post('/delete/:id', isAdminOrSales, async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    if (quotation.status === 'converted' || quotation.status === 'accepted') {
      return res.status(400).json({ success: false, message: 'Cannot delete accepted or converted quotations' });
    }

    await Quotation.findByIdAndDelete(req.params.id);
    res.redirect('/quotations?success=Quotation deleted successfully');
  } catch (error) {
    console.error('Delete quotation error:', error);
    res.redirect('/quotations?error=Unable to delete quotation');
  }
});

module.exports = router;