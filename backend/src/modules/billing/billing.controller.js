const Billing = require('./billing.model');
const Patient = require('../patients/patient.model');
const AppError = require('../../core/utils/appError');

exports.getAllBilling = async (req, res, next) => {
  try {
    const query = { clinicId: req.clinicId };
    
    // Optional filtering
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.patientId) {
      query.patientId = req.query.patientId;
    }

    const billings = await Billing.find(query)
      .populate('patientId', 'firstName lastName phone email')
      .populate('appointmentId', 'appointmentDate appointmentTime status')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      results: billings.length,
      data: { billings }
    });
  } catch (error) {
    next(error);
  }
};

exports.getBilling = async (req, res, next) => {
  try {
    const billing = await Billing.findOne({
      _id: req.params.id,
      clinicId: req.clinicId
    })
      .populate('patientId')
      .populate('appointmentId');

    if (!billing) {
      return next(new AppError('No invoice found with that ID', 404));
    }

    res.status(200).json({
      success: true,
      data: { billing }
    });
  } catch (error) {
    next(error);
  }
};

exports.createBilling = async (req, res, next) => {
  try {
    // Validate patient belongs to clinic
    const patient = await Patient.findOne({ _id: req.body.patientId, clinicId: req.clinicId });
    if (!patient) {
      return next(new AppError('Invalid patient ID or patient does not belong to this clinic', 400));
    }

    const newBilling = await Billing.create({
      ...req.body,
      clinicId: req.clinicId
    });

    res.status(201).json({
      success: true,
      data: { billing: newBilling }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBilling = async (req, res, next) => {
  try {
    const billing = await Billing.findOneAndUpdate(
      { _id: req.params.id, clinicId: req.clinicId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!billing) {
      return next(new AppError('No invoice found with that ID', 404));
    }

    res.status(200).json({
      success: true,
      data: { billing }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBilling = async (req, res, next) => {
  try {
    const billing = await Billing.findOneAndDelete({
      _id: req.params.id,
      clinicId: req.clinicId
    });

    if (!billing) {
      return next(new AppError('No invoice found with that ID', 404));
    }

    res.status(204).json({
      success: true,
      data: null
    });
  } catch (error) {
    next(error);
  }
};
