const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// Register
router.get('/register', (req, res) => {
    res.render('auth/register', { title: 'Register', error: null });
});

// Register Post
router.post('/register', [
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Min 6 char password'),
    body('role').isIn(['admin', 'sales', 'telecaller', 'support']).withMessage('Invalid role')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('auth/register', { title: 'Register', error: errors.array()[0].msg });
    }

    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.render('auth/register', { title: 'Register', error: 'Email already exists' });

    const user = new User({ name, email, password, role });
    await user.save();
    res.redirect('/');
}); 

// Login Page
router.get('/login', (req, res) => {
    res.render('auth/login', { title: 'Login', error: null });
});

// Login Post
router.post('/login', [
    body('email').isEmail().withMessage('Enter valid email'),
    body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('auth/login', { title: 'Login', error: errors.array()[0].msg, });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email, isActive: true });
    if (!user) return res.render('auth/login', { title: 'Login', error: 'Invalid email or password' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.render('auth/login', { title: 'Login', error: 'Invalid email or password' });

    user.lastLogin = new Date();
    await user.save();

    req.session.user = { _id: user._id, name: user.name, email: user.email, role: user.role };
    res.redirect('/');
});

router.get('/logout',async(req,res)=>{
    req.session.destroy(err =>{
        if(err){
            console.log('logout successfully');
            return res.redirect('/');
        }
         res.clearCookie('connect.sid');
        res.redirect('/auth/login');
    })
})

module.exports = router;