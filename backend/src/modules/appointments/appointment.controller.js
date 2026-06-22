const Appointment = require('./appointment.model');
const Doctor = require('../doctors/doctor.model');
const AppError = require('../../core/utils/appError');

exports.getAllAppointments = async (req, res, next) => {
  try {
    const filter = { clinicId: req.clinicId };
    
    if (req.query.doctorId) filter.doctorId = req.query.doctorId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.date) {
      const date = new Date(req.query.date);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      filter.appointmentDate = { $gte: date, $lt: nextDate };
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'firstName lastName phone patientId')
      .populate('doctorId', 'name specialization')
      .sort('appointmentDate appointmentTime');
    
    res.status(200).json({
      success: true,
      results: appointments.length,
      data: { appointments }
    });
  } catch (error) {
    next(error);
  }
};

exports.createAppointment = async (req, res, next) => {
  try {
    const { doctorId, appointmentDate, appointmentTime, patientId, reason } = req.body;
    
    const doctor = await Doctor.findOne({ _id: doctorId, clinicId: req.clinicId });
    if (!doctor || !doctor.isActive) {
      return next(new AppError('Selected doctor is not available or inactive.', 400));
    }

    const dateObj = new Date(appointmentDate);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (doctor.availability && doctor.availability.workingDays && doctor.availability.workingDays.length > 0) {
      if (!doctor.availability.workingDays.includes(dayOfWeek)) {
        return next(new AppError(`Doctor does not work on ${dayOfWeek}s.`, 400));
      }
      
      const { startTime, endTime } = doctor.availability;
      if (startTime && endTime) {
        if (appointmentTime < startTime || appointmentTime > endTime) {
          return next(new AppError(`Appointment time is outside the doctor's working hours (${startTime} - ${endTime}).`, 400));
        }
      }
    }

    const startOfDay = new Date(dateObj);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingAppointment = await Appointment.findOne({
      clinicId: req.clinicId,
      doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      appointmentTime,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return next(new AppError('The doctor is already booked for this time slot.', 400));
    }

    const newAppointment = await Appointment.create({
      ...req.body,
      clinicId: req.clinicId,
      patientId,
      doctorId,
      appointmentDate: dateObj,
      appointmentTime,
      reason,
      createdBy: req.user._id
    });

    if (req.app.get('io')) req.app.get('io').emit('data_changed');
    res.status(201).json({
      success: true,
      data: { appointment: newAppointment }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAppointment = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    
    if (updates.status === 'checked_in' && !updates.checkedInAt) {
      updates.checkedInAt = new Date();
    } else if (updates.status === 'in_consultation' && !updates.startedAt) {
      updates.startedAt = new Date();
    } else if (updates.status === 'completed' && !updates.completedAt) {
      updates.completedAt = new Date();
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, clinicId: req.clinicId },
      updates,
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return next(new AppError('No appointment found with that ID', 404));
    }

    if (req.app.get('io')) req.app.get('io').emit('data_changed');
    res.status(200).json({
      success: true,
      data: { appointment }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndDelete({ _id: req.params.id, clinicId: req.clinicId });

    if (!appointment) {
      return next(new AppError('No appointment found with that ID', 404));
    }

    if (req.app.get('io')) req.app.get('io').emit('data_changed');
    res.status(200).json({
      success: true,
      data: null
    });
  } catch (error) {
    next(error);
  }
};
