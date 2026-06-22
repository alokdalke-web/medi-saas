const Patient = require('./patient.model');
const AppError = require('../../core/utils/appError');

exports.getAllPatients = async (req, res, next) => {
  try {
    const filter = { clinicId: req.clinicId };
    
    // Global search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { phone: searchRegex },
        { patientId: searchRegex }
      ];
    }

    const patients = await Patient.find(filter).sort('-createdAt');
    
    res.status(200).json({
      success: true,
      results: patients.length,
      data: { patients }
    });
  } catch (error) {
    next(error);
  }
};

exports.getPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, clinicId: req.clinicId })
      .populate('createdBy', 'name email');
    
    if (!patient) {
      return next(new AppError('No patient found with that ID', 404));
    }

    res.status(200).json({
      success: true,
      data: { patient }
    });
  } catch (error) {
    next(error);
  }
};

exports.createPatient = async (req, res, next) => {
  try {
    const newPatient = await Patient.create({
      ...req.body,
      clinicId: req.clinicId,
      createdBy: req.user._id
    });

    if (req.app.get('io')) req.app.get('io').emit('data_changed');
    res.status(201).json({
      success: true,
      data: { patient: newPatient }
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, clinicId: req.clinicId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return next(new AppError('No patient found with that ID', 404));
    }

    if (req.app.get('io')) req.app.get('io').emit('data_changed');
    res.status(200).json({
      success: true,
      data: { patient }
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findOneAndDelete({ _id: req.params.id, clinicId: req.clinicId });

    if (!patient) {
      return next(new AppError('No patient found with that ID in this clinic', 404));
    }

    // Cascade delete appointments
    const Appointment = require('../appointments/appointment.model');
    await Appointment.deleteMany({ patientId: patient._id });

    if (req.app.get('io')) req.app.get('io').emit('data_changed');
    res.status(200).json({
      success: true,
      data: null
    });
  } catch (error) {
    next(error);
  }
};
