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
      const [totalPatients, totalDoctors, totalAppointments, recentAppointments, recentPatients] = await Promise.all([
        Patient.countDocuments({ clinicId, isDeleted: { $ne: true } }),
        Doctor.countDocuments({ clinicId, isActive: true }),
        Appointment.countDocuments({ clinicId }),
        Appointment.find({ clinicId })
          .populate('patientId', 'firstName lastName patientId')
          .populate('doctorId', 'name specialization')
          .sort('-createdAt')
          .limit(5),
        Patient.find({ clinicId, isDeleted: { $ne: true } })
          .sort('-createdAt')
          .limit(5)
      ]);

      const activities = [
        ...recentAppointments.map(apt => ({
          id: apt._id.toString() + '_apt',
          type: 'appointment',
          title: apt.status === 'scheduled' ? 'New Appointment Scheduled' : `Appointment ${apt.status}`,
          description: `Appointment for ${apt.patientId?.firstName} ${apt.patientId?.lastName} with Dr. ${apt.doctorId?.name}.`,
          timestamp: apt.createdAt,
          icon: apt.status === 'cancelled' ? 'event_busy' : 'event',
          colorClass: apt.status === 'cancelled' ? 'bg-[#fee2e2]' : 'bg-[#dbeafe]',
          iconColor: apt.status === 'cancelled' ? 'text-error' : 'text-secondary'
        })),
        ...recentPatients.map(pat => ({
          id: pat._id.toString() + '_pat',
          type: 'patient',
          title: 'New Patient Registered',
          description: `${pat.firstName} ${pat.lastName} has been registered.`,
          timestamp: pat.createdAt,
          icon: 'person_add',
          colorClass: 'bg-[#dcfce7]',
          iconColor: 'text-primary'
        }))
      ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

      stats = {
        totalPatients,
        totalDoctors,
        totalAppointments,
        recentAppointments,
        activities
      };
    } 
    else if (role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id, clinicId });
      if (!doctor) {
        return next(new AppError('Doctor profile not found', 404));
      }

      const [todaysAppointments, totalTreatedPatients, upcomingAppointments, appointmentHistory] = await Promise.all([
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
          .limit(5),
        Appointment.find({
          clinicId,
          doctorId: doctor._id,
        })
          .populate('patientId', 'firstName lastName patientId')
          .sort('-appointmentDate -appointmentTime')
      ]);

      stats = {
        todaysAppointments,
        totalPatientsTreated: totalTreatedPatients.length,
        upcomingAppointments,
        appointmentHistory
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
    else if (role === 'patient') {
      const patientId = req.user._id; // In reality, we'd map user to patient, but for this simple setup we assume req.user._id or a known ID.
      // Fetching by clinicId and patientId (or just using a generic query for the prototype)
      const [upcomingAppointments, pastAppointments] = await Promise.all([
        Appointment.find({ 
          clinicId, 
          // patientId: patientId, // uncomment if patient mapped 
          appointmentDate: { $gte: todayStart },
          status: { $in: ['scheduled', 'checked_in'] }
        })
          .populate('doctorId', 'name specialization')
          .sort('appointmentDate appointmentTime')
          .limit(5),
        Appointment.find({ 
          clinicId, 
          // patientId: patientId, 
          $or: [
            { appointmentDate: { $lt: todayStart } },
            { status: 'completed' }
          ]
        })
          .populate('doctorId', 'name specialization')
          .sort('-appointmentDate -appointmentTime')
          .limit(5)
      ]);

      stats = {
        upcomingAppointments,
        pastAppointments
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
