const User = require('../models/User');

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth/login');
};

const hasRole = (roles) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    
    if (roles.includes(req.session.user.role)) {
      return next();
    }
    
    res.status(403).render('error', {
      title: 'Access Denied',
      error: { message: 'You do not have permission to access this resource.' }
    });
  };
};

const isAdmin = hasRole(['admin']);

const isAdminOrSales = hasRole(['admin', 'sales']);

const isStaff = hasRole(['admin', 'sales', 'telecaller', 'support']);

const attachUser = async (req, res, next) => {
  if (req.session.user) {
    try {
      const user = await User.findById(req.session.user._id).select('-password');
      req.user = user;
      res.locals.user = user;
    } catch (error) {
      console.error('Error attaching user:', error);
    }
  }
  next();
};

module.exports = {
  isAuthenticated,
  hasRole,
  isAdmin,
  isAdminOrSales,
  isStaff,
  attachUser
};