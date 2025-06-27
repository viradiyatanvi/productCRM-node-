const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../middleware/upload');
const { isAdminOrSales, isAuthenticated } = require('../middleware/auth');

// GET
router.get('/', isAuthenticated, productController.listProducts);
router.get('/add', isAdminOrSales, productController.getAddForm);
router.get('/edit/:id', isAdminOrSales, productController.getEditForm);
router.get('/:id', isAuthenticated, productController.viewProduct);

// POST
router.post('/add', isAdminOrSales, upload.array('images', 5), productController.addProduct);
router.post('/edit/:id', isAdminOrSales, upload.array('images', 5), productController.updateProduct);
router.post('/delete/:id', isAdminOrSales, productController.deleteProduct);
    
module.exports = router;