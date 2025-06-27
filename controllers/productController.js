const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

// Show Add Product Form
exports.getAddForm = (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render("error", {
      message: "Only Admin is allowed",
      user: req.session.user || null
    });
  }

  res.render('products/add', {
    title: 'Add Product',
    error: null,
    success: null,
    formData: {},
    user: req.session.user,
  });
};

//  Add Product
exports.addProduct = async (req, res) => {
  try {
    const { name, category, price, description, stockQuantity, features, status } = req.body;

    const sku = `SKU-${Date.now()}`;
    const featureList = features ? features.split('\n').filter(f => f.trim()) : [];

    const images = req.files ? req.files.map(file => '/uploads/products/' + file.filename) : [];

    const newProduct = new Product({
      name,
      category,
      price,
      description,
      stockQuantity,
      status: status || 'inactive',
      features: featureList,
      sku,
      images,
      createdBy: req.session.user._id,
      user:req.session.user
    });

    await newProduct.save();

    res.redirect('/products?success=Product added successfully');
  } catch (err) {
    console.error('Add Product Error:', err);
    res.render('products/add', {
      title: 'Add Product',
      error: 'Something went wrong!',
      success: null,
      formData: req.body,
      user:req.session.user
    });
  }
};

//  List Products
exports.listProducts = async (req, res) => {
  try {
    const { search, category, status, page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    let query = {};

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') }, // case-insensitive(name and sku find kari aape)
        { sku: new RegExp(search, 'i') }
      ];
    }
    if (category) query.category = category;
    if (status) query.status = status;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const categories = await Product.distinct('category');

    res.render('products/list', {
      title: 'Products',
      products,
      query: req.query,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      categories,
      user:req.session.user
    });
  } catch (err) {
    console.error('List Product Error:', err);
    res.redirect('/dashboard');
  }
};

// View Single Product
exports.viewProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('createdBy', 'name');
    if (!product) return res.redirect('/products?error=Product not found');

    res.render('products/view', {
      title: 'Product Details',
       user: req.session.user,
      product
    });
  } catch (err) {
    console.error('View Product Error:', err);
    res.redirect('/products?error=Something went wrong');
  }
};

// Show Edit Form
exports.getEditForm = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.redirect('/products?error=Product not found');

    res.render('products/edit', {
      title: 'Edit Product',
      product,
       user: req.session.user,
      error: null
    });
  } catch (err) {
    console.error('Get Edit Form Error:', err);
    res.redirect('/products?error=Something went wrong');
  }
};

//  Update Product
exports.updateProduct = async (req, res) => {
  try {
    const { name, category, price, description, stockQuantity, features, status } = req.body;

    const updateData = {
      name,
      category,
      price,
      description,
      stockQuantity,
      status: status || 'inactive',
      features: features ? features.split('\n').filter(f => f.trim()) : []
    };

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(file => '/uploads/products/' + file.filename);
    }

    await Product.findByIdAndUpdate(req.params.id, updateData);

    res.redirect('/products?success=Product updated successfully');
  } catch (err) {
    console.error('Update Product Error:', err);
    res.redirect(`/products/edit/${req.params.id}?error=Update failed`);
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.redirect('/products?error=Product not found');

    // Remove images
    if (product.images.length > 0) {
      product.images.forEach(img => {
        const filepath = path.join(__dirname, '..', 'public', img);
        fs.unlink(filepath, err => {
          if (err) console.error('Image delete error:', err);
        });
      });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/products?success=Product deleted');
  } catch (err) {
    console.error('Delete Product Error:', err);
    res.redirect('/products?error=Delete failed');
  }
};