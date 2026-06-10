const AppError = require('../utils/appError');

const requireTenant = (req, res, next) => {
  // Ensure the user has a clinicId
  if (!req.user || !req.user.clinicId) {
    return next(new AppError('Unauthorized: User does not belong to a clinic', 403));
  }
  
  // Attach clinicId to request for easy access in controllers
  req.clinicId = req.user.clinicId;
  next();
};

module.exports = { requireTenant };
