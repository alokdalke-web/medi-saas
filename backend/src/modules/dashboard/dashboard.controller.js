const Patient = require('../patients/patient.model');
const Doctor = require('../doctors/doctor.model');
const Appointment = require('../appointments/appointment.model');
const AppError = require('../../core/utils/appError');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const { role } = req.user;
    const clinicId = req.clinicId;
    let stats = {};

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    if (role === 'clinic_admin') {
      const [totalPatients, totalDoctors, totalAppointments, recentAppointments] = await Promise.all([
        Patient.countDocuments({ clinicId, isDeleted: { $ne: true } }),
        Doctor.countDocuments({ clinicId, isActive: true }),
        Appointment.countDocuments({ clinicId }),
        Appointment.find({ clinicId })
          .populate('patientId', 'firstName lastName patientId')
          .populate('doctorId', 'name specialization')
          .sort('-createdAt')
          .limit(5)
      ]);

      stats = {
        totalPatients,
        totalDoctors,
        totalAppointments,
        recentAppointments
      };
    } 
    else if (role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id, clinicId });
      if (!doctor) {
        return next(new AppError('Doctor profile not found', 404));
      }

      const [todaysAppointments, totalTreatedPatients, upcomingAppointments] = await Promise.all([
        Appointment.countDocuments({ 
          clinicId, 
          doctorId: doctor._id, 
          appointmentDate: { $gte: todayStart, $lt: todayEnd } 
        }),
        Appointment.distinct('patientId', { clinicId, doctorId: doctor._id, status: 'completed' }),
        Appointment.find({ 
          clinicId, 
          doctorId: doctor._id, 
          appointmentDate: { $gte: todayStart },
          status: { $in: ['scheduled', 'checked_in'] }
        })
          .populate('patientId', 'firstName lastName gender phone')
          .sort('appointmentDate appointmentTime')
          .limit(5)
      ]);

      stats = {
        todaysAppointments,
        totalPatientsTreated: totalTreatedPatients.length,
        upcomingAppointments
      };
    }
    else if (role === 'receptionist') {
      const [totalToday, checkedInToday, scheduledToday, todayQueue] = await Promise.all([
        Appointment.countDocuments({ clinicId, appointmentDate: { $gte: todayStart, $lt: todayEnd } }),
        Appointment.countDocuments({ clinicId, appointmentDate: { $gte: todayStart, $lt: todayEnd }, status: 'checked_in' }),
        Appointment.countDocuments({ clinicId, appointmentDate: { $gte: todayStart, $lt: todayEnd }, status: 'scheduled' }),
        Appointment.find({ clinicId, appointmentDate: { $gte: todayStart, $lt: todayEnd } })
          .populate('patientId', 'firstName lastName patientId phone')
          .populate('doctorId', 'name specialization')
          .sort('appointmentTime')
      ]);

      stats = {
        totalToday,
        checkedInToday,
        scheduledToday,
        todayQueue
      };
    }
    else {
      return next(new AppError('Role not supported for dashboard stats', 400));
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};
