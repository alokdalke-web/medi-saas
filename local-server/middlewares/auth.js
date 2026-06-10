const jwt = require('jsonwebtoken');
const db = require('../db');

const protect = (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'You are not logged in! Please log in to get access.' });
    }

    const decoded = jwt.verify(token, process.env.LOCAL_JWT_SECRET);
    
    // Find user locally by email since cloud IDs don't match local IDs yet
    const currentUser = db.prepare('SELECT * FROM users WHERE email = ?').get(decoded.email);

    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'The user belonging to this token no longer exists locally.' });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token or token expired.' });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action' });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
