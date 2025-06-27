const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const User = require('../models/User');
const { isAuthenticated, isAdminOrSales } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const moment = require('moment');

// List Sales
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.salesPerson) filter.salesPerson = req.query.salesPerson;
    if (req.query.dateFrom || req.query.dateTo) {
      filter.saleDate = {};
      if (req.query.dateFrom) filter.saleDate.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.saleDate.$lte = new Date(req.query.dateTo);
    }

    const sales = await Sale.find(filter)
      .populate('customer', 'name email phone')
      .populate('products.product', 'name')
      .populate('salesPerson', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Sale.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Fetch sales persons for filter
    const salesPersons = await User.find({ role: { $in: ['admin', 'sales'] }, isActive: true });

    // Fetch all sales for statistics
    const allSales = await Sale.find(filter);
    const totalRevenue = allSales.reduce((sum, s) => sum + s.finalAmount, 0);
    const pendingPayments = allSales.filter(s => s.paymentStatus === 'pending').length;
    const averageSale = allSales.length > 0 ? Math.round(totalRevenue / allSales.length) : 0;

    res.render('sales/list', {
      title: 'Sales',
      sales,
      salesPersons,
      currentPage: page,
      totalPages,
      query: req.query,
      user: req.session.user,
      moment,
      stats: {
        totalRevenue,
        totalSales: allSales.length, // product
        pendingPayments,
        averageSale
      }
    });
  } catch (error) {
    console.error('Sales list error:', error);
    res.status(500).render('error', {
      title: 'Sales Error',
      error: { message: 'Unable to load sales' }
    });
  }
});

// Show Add Sale Page
router.get('/add', isAdminOrSales, async (req, res) => {
  try {
    const customers = await Customer.find({ isActive: true });
    const products = await Product.find({ status: 'active' });

    res.render('sales/add', {
      title: 'Record Sale',
      customers,
      products,
      error: null,
      formData: {},
      user: req.session.user,
      moment
    });
  } catch (error) {
    console.error('Add sale page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { message: 'Unable to load add sale page' }
    });
  }
});

// Process Add Sale
router.post('/add', isAdminOrSales, [
  body('customer').notEmpty().withMessage('Customer is required'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Invalid total amount'),
  body('finalAmount').isFloat({ min: 0 }).withMessage('Invalid final amount'),
  body('products').notEmpty().withMessage('Products are required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    const customers = await Customer.find({ isActive: true });
    const productsList = await Product.find({ status: 'active' });

    if (!errors.isEmpty()) {
      return res.render('sales/add', {
        title: 'Record Sale',
        customers,
        products: productsList,
        error: errors.array()[0].msg,
        formData: req.body,
        user: req.session.user,
        moment
      });
    }

    let parsedProducts; // product
    try {
      parsedProducts = JSON.parse(req.body.products); //  JSON object me convert kiya jata he
    } catch {
      return res.render('sales/add', {
        title: 'Record Sale',
        customers,
        products: productsList,
        error: 'Invalid product data',
        formData: req.body,
        user: req.session.user,
        moment
      });
    }

    if (!Array.isArray(parsedProducts) || parsedProducts.length === 0) {
      return res.render('sales/add', {
        title: 'Record Sale',
        customers,
        products: productsList,
        error: 'At least one product is required',
        formData: req.body,
        user: req.session.user,
        moment
      });
    }

    const finalProducts = parsedProducts.map((p, i) => {
      if (!p.product || !p.quantity || !p.price) {
        throw new Error(`Invalid product at row ${i + 1}`);
      }
      return {
        product: p.product,
        quantity: parseInt(p.quantity),
        price: parseFloat(p.price),
        discount: parseFloat(p.discount || 0)
      };
    });

    const saleData = {
      customer: req.body.customer,
      products: finalProducts,
      totalAmount: parseFloat(req.body.totalAmount),
      discount: parseFloat(req.body.discount || 0),
      tax: parseFloat(req.body.tax || 0),
      finalAmount: parseFloat(req.body.finalAmount),
      paymentStatus: req.body.paymentStatus || 'pending',
      paymentMethod: req.body.paymentMethod || 'cash',
      saleDate: req.body.saleDate || new Date(),
      notes: req.body.notes || '',
      salesPerson: req.session.user._id
    };

    const newSale = new Sale(saleData);
    await newSale.save();

    for (const item of finalProducts) {
      await Product.findByIdAndUpdate(item.product, { //Jab product ki sale hoti hai, to us product ki quantity me se -item.quantity minus kiya jaata hai.
        $inc: { stockQuantity: -item.quantity } //$inc MongoDB ka operator hai jo increment/decrement karta hai.
      });
    }

    res.redirect('/sales?success=Sale recorded successfully');
  } catch (error) {
    console.error('Add sale error:', error);
    const customers = await Customer.find({ isActive: true });
    const productsList = await Product.find({ status: 'active' });

    res.render('sales/add', {
      title: 'Record Sale',
      customers,
      products: productsList,
      error: 'Something went wrong while saving sale',
      formData: req.body,
      user: req.session.user,
      moment
    });
  }
});

// Sale Details
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer', 'name email phone address')
      .populate('products.product', 'name category')
      .populate('salesPerson', 'name email');

    if (!sale) {
      return res.status(404).render('error', {
        title: '404',
        error: { message: 'Sale not found' }
      });
    }

    res.render('sales/view', {
      title: `Invoice: ${sale.invoiceNumber}`,
      sale,
      moment,
      user: req.session.user
    });
  } catch (error) {
    console.error('Sale details error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: { message: 'Unable to load sale details' },
    });
  }
});

router.post('/update-payment/:id', isAdminOrSales, express.json(), async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const allowedStatuses = ['pending', 'partial', 'paid', 'refunded'];
    if (!allowedStatuses.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    sale.paymentStatus = paymentStatus;
    if (paymentStatus === 'paid') {
      sale.paidAt = new Date();
    }

    await sale.save();

    return res.json({ success: true, message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Update payment status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update payment status' });
  }
});

module.exports = router;