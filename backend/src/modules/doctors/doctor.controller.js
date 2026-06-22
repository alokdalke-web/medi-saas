const Doctor = require('./doctor.model');
const User = require('../users/user.model');
const AppError = require('../../core/utils/appError');
const crypto = require('crypto');

exports.getAllDoctors = async (req, res, next) => {
  try {
    const filter = { clinicId: req.clinicId };
    
    // Optional filtering by specialization
    if (req.query.specialization) {
      filter.specialization = req.query.specialization;
    }

    const doctors = await Doctor.find(filter).populate('userId', 'email role isActive');
    
    res.status(200).json({
      success: true,
      results: doctors.length,
      data: { doctors }
    });
  } catch (error) {
    next(error);
  }
};

exports.getDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ _id: req.params.id, clinicId: req.clinicId }).populate('userId', 'email role isActive');
    
    if (!doctor) {
      return next(new AppError('No doctor found with that ID in this clinic', 404));
    }

    res.status(200).json({
      success: true,
      data: { doctor }
    });
  } catch (error) {
    next(error);
  }
};

exports.createDoctor = async (req, res, next) => {
  try {
    const { name, email, phone, password, specialization, qualification, experience, availability } = req.body;

    // Create the User first
    const newUser = await User.create({
      clinicId: req.clinicId,
      name,
      email,
      password,
      phone,
      role: 'doctor'
    });

    // Generate a simple doctor code (DOC + 6 random hex)
    const doctorCode = 'DOC' + crypto.randomBytes(3).toString('hex').toUpperCase();

    // Create the Doctor Profile
    const newDoctor = await Doctor.create({
      ...(req.body._id && { _id: req.body._id }),
      clinicId: req.clinicId,
      userId: newUser._id,
      doctorCode,
      name,
      email,
      phone,
      specialization,
      qualification,
      experience,
      availability
    });

    if (req.app.get('io')) req.app.get('io').emit('data_changed');
    res.status(201).json({
      success: true,
      data: { doctor: newDoctor }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateDoctor = async (req, res, next) => {
  try {
    const { name, phone, specialization, qualification, experience, availability, isActive } = req.body;
    
    const doctor = await Doctor.findOneAndUpdate(
      { _id: req.params.id, clinicId: req.clinicId },
      { name, phone, specialization, qualification, experience, availability, isActive },
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return next(new AppError('No doctor found with that ID in this clinic', 404));
    }

    // Keep underlying User in sync if name or phone changed
    if (name || phone || isActive !== undefined) {
      await User.findByIdAndUpdate(doctor.userId, { 
        ...(name && { name }), 
        ...(phone && { phone }),
        ...(isActive !== undefined && { isActive })
      });
    }

    if (req.app.get('io')) req.app.get('io').emit('data_changed');
    res.status(200).json({
      success: true,
      data: { doctor }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOneAndDelete({ _id: req.params.id, clinicId: req.clinicId });

    if (!doctor) {
      return next(new AppError('No doctor found with that ID in this clinic', 404));
    }

    // Hard delete the associated user as well
    await User.findByIdAndDelete(doctor.userId);

    // Cascade delete appointments
    const Appointment = require('../appointments/appointment.model');
    await Appointment.deleteMany({ doctorId: doctor._id });

    if (req.app.get('io')) req.app.get('io').emit('data_changed');
    res.status(200).json({
      success: true,
      data: null
    });
  } catch (error) {
    next(error);
  }
};
