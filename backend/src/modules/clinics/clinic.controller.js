const Clinic = require('./clinic.model');
const AppError = require('../../core/utils/appError');

exports.getMyClinic = async (req, res, next) => {
  try {
    const clinic = await Clinic.findById(req.clinicId);
    if (!clinic) {
      return next(new AppError('Clinic not found', 404));
    }
    
    res.status(200).json({
      success: true,
      data: { clinic }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateMyClinic = async (req, res, next) => {
  try {
    const { name, email, phone, address, logo } = req.body;
    
    const clinic = await Clinic.findByIdAndUpdate(
      req.clinicId,
      { name, email, phone, address, logo },
      { new: true, runValidators: true }
    );

    if (!clinic) {
      return next(new AppError('Clinic not found', 404));
    }

    res.status(200).json({
      success: true,
      data: { clinic }
    });
  } catch (error) {
    next(error);
  }
};
