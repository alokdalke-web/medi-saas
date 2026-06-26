const Event = require('./sync.model');
const Clinic = require('../clinics/clinic.model');
const User = require('../users/user.model');
const Doctor = require('../doctors/doctor.model');
const Patient = require('../patients/patient.model');
const Appointment = require('../appointments/appointment.model');
const MedicalRecord = require('../medical-records/medical-record.model');
const NotificationService = require('../notifications/services/notification.service');

exports.pushEvents = async (req, res, next) => {
  try {
    const { events } = req.body;
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid events array' });
    }

    let processedCount = 0;

    for (const event of events) {
      // Idempotency: skip if event already exists
      const existingEvent = await Event.findById(event.id);
      if (existingEvent) continue;

      // Save to Event Store
      await Event.create({
        _id: event.id,
        node_id: event.node_id,
        event_type: event.event_type,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        payload: event.payload,
        version: event.version,
        created_at: new Date(event.created_at)
      });

      // Apply to Read Models (Mongoose Collections)
      const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;

      try {
        switch (event.event_type) {
          case 'ClinicCreated':
            await Clinic.create({ _id: event.entity_id, ...payload });
            break;
          case 'ClinicUpdated':
            await Clinic.findByIdAndUpdate(event.entity_id, payload);
            break;
          case 'UserCreated':
            await User.create({ 
              _id: event.entity_id,
              name: payload.name || 'Unknown User',
              email: payload.email || `user_${event.entity_id}@unknown.com`,
              password: payload.password || 'defaultpass123',
              role: payload.role || 'receptionist',
              clinicId: payload.clinicId || payload.clinic_id || 'default_clinic_id',
              isActive: (payload.isActive !== false && payload.is_active !== 0),
              ...payload 
            });
            break;
          case 'UserUpdated':
            await User.findByIdAndUpdate(event.entity_id, { ...payload, isActive: (payload.isActive !== false && payload.is_active !== 0) });
            break;
          case 'UserDeleted':
            await User.findByIdAndUpdate(event.entity_id, { isDeleted: true, deletedAt: new Date() });
            break;
          case 'DoctorCreated':
            await Doctor.create({ 
              _id: event.entity_id,
              userId: payload.userId || payload.user_id || event.entity_id,
              doctorCode: payload.doctorCode || payload.doctor_code || `DOC-${event.entity_id.substring(0,5)}`,
              name: payload.name || 'Unknown Doctor',
              email: payload.email || `doc_${event.entity_id}@unknown.com`,
              phone: payload.phone || '0000000000',
              specialization: payload.specialization || 'General',
              qualification: payload.qualification || 'MBBS',
              clinicId: payload.clinicId || payload.clinic_id || 'default_clinic_id',
              isActive: (payload.isActive !== false && payload.is_active !== 0),
              ...payload 
            });
            break;
          case 'DoctorUpdated':
            await Doctor.findByIdAndUpdate(event.entity_id, { ...payload, isActive: payload.isActive !== false });
            break;
          case 'DoctorDeleted':
            await Doctor.findByIdAndUpdate(event.entity_id, { isDeleted: true, deletedAt: new Date() });
            break;
          case 'PatientCreated':
            await Patient.create({ 
              _id: event.entity_id,
              firstName: payload.firstName || payload.first_name || 'Unknown',
              lastName: payload.lastName || payload.last_name || 'Patient',
              gender: payload.gender || 'Other',
              dateOfBirth: (payload.dateOfBirth || payload.date_of_birth) ? new Date(payload.dateOfBirth || payload.date_of_birth) : new Date(),
              phone: payload.phone || '0000000000',
              patientId: payload.patientId || payload.patient_id || `PAT-${event.entity_id.substring(0,5)}`,
              clinicId: payload.clinicId || payload.clinic_id || 'default_clinic_id',
              ...payload 
            });
            break;
          case 'PatientUpdated':
            await Patient.findByIdAndUpdate(event.entity_id, payload);
            break;
          case 'PatientDeleted':
            await Patient.findByIdAndUpdate(event.entity_id, { isDeleted: true, deletedAt: new Date() });
            break;
          case 'MedicalRecordCreated':
            await MedicalRecord.create({
              _id: event.entity_id,
              clinicId: payload.clinicId || payload.clinic_id || 'default_clinic_id',
              patientId: payload.patientId || payload.patient_id,
              doctorId: payload.doctorId || payload.doctor_id,
              recordType: payload.recordType || payload.record_type,
              content: payload.content || payload,
              ...payload
            });
            break;
          case 'MedicalRecordUpdated':
            await MedicalRecord.findByIdAndUpdate(event.entity_id, payload);
            break;
          case 'MedicalRecordDeleted':
            await MedicalRecord.findByIdAndUpdate(event.entity_id, { isDeleted: true, deletedAt: new Date() });
            break;
          case 'AppointmentCreated':
            const newAppt = await Appointment.create({
              _id: event.entity_id,
              patientId: payload.patientId || payload.patient_id,
              doctorId: payload.doctorId || payload.doctor_id,
              appointmentDate: new Date(payload.appointmentDate || payload.appointment_date),
              appointmentTime: payload.appointmentTime || payload.appointment_time,
              status: payload.status || 'scheduled',
              reason: payload.reason,
              clinicId: payload.clinicId || payload.clinic_id || 'default_clinic_id'
            });

            // Trigger Email Notification (Added for Desktop App support)
            try {
              const pat = await Patient.findById(newAppt.patientId);
              const cli = await Clinic.findById(newAppt.clinicId);
              const doc = await Doctor.findById(newAppt.doctorId);

              if (pat && pat.email) {
                NotificationService.sendAppointmentConfirmation({
                  patientEmail: pat.email,
                  patientName: `${pat.firstName} ${pat.lastName}`,
                  clinicName: cli ? cli.name : 'Our Clinic',
                  doctorName: doc ? doc.name : 'Your Doctor',
                  appointmentDate: newAppt.appointmentDate.toLocaleDateString(),
                  appointmentTime: newAppt.appointmentTime,
                  appointmentId: newAppt._id.toString(),
                  clinicPhone: cli ? cli.phone : ''
                });
              }

              if (doc && doc.email) {
                NotificationService.sendDoctorBookingNotification({
                  doctorEmail: doc.email,
                  doctorName: doc.name,
                  patientName: pat ? `${pat.firstName} ${pat.lastName}` : 'A Patient',
                  clinicName: cli ? cli.name : 'Our Clinic',
                  appointmentDate: newAppt.appointmentDate.toLocaleDateString(),
                  appointmentTime: newAppt.appointmentTime,
                  reason: newAppt.reason,
                  appointmentId: newAppt._id.toString()
                });
              }
            } catch (err) {
              console.error('[SyncController Notification Error]', err.message);
            }
            break;
          case 'AppointmentUpdated':
            const oldAppt = await Appointment.findByIdAndUpdate(event.entity_id, {
              status: payload.status,
              reason: payload.reason,
              appointmentDate: new Date(payload.appointmentDate),
              appointmentTime: payload.appointmentTime
            }).populate('patientId').populate('doctorId');

            if (oldAppt) {
              try {
                const pat = oldAppt.patientId;
                const doc = oldAppt.doctorId;
                const cli = await Clinic.findById(oldAppt.clinicId);
                const baseData = {
                  clinicName: cli ? cli.name : 'Our Clinic',
                  clinicPhone: cli ? cli.phone : '',
                  appointmentId: oldAppt._id.toString()
                };

                if (payload.status === 'cancelled' && oldAppt.status !== 'cancelled') {
                  const cancelData = { ...baseData, appointmentDate: oldAppt.appointmentDate.toLocaleDateString(), appointmentTime: oldAppt.appointmentTime };
                  if (pat && pat.email) NotificationService.sendCancellationNotification(cancelData, pat.email, `${pat.firstName} ${pat.lastName}`);
                  if (doc && doc.email) NotificationService.sendCancellationNotification(cancelData, doc.email, doc.name);
                } else if (new Date(payload.appointmentDate).getTime() !== oldAppt.appointmentDate.getTime() || payload.appointmentTime !== oldAppt.appointmentTime) {
                  const reschedData = { ...baseData, newAppointmentDate: new Date(payload.appointmentDate).toLocaleDateString(), newAppointmentTime: payload.appointmentTime };
                  if (pat && pat.email) NotificationService.sendRescheduleNotification(reschedData, pat.email, `${pat.firstName} ${pat.lastName}`);
                  if (doc && doc.email) NotificationService.sendRescheduleNotification(reschedData, doc.email, doc.name);
                }
              } catch (err) {
                console.error('[SyncController Update Notification Error]', err.message);
              }
            }
            break;
          case 'AppointmentDeleted':
            const deletedAppt = await Appointment.findByIdAndDelete(event.entity_id).populate('patientId').populate('doctorId');
            if (deletedAppt) {
              try {
                const pat = deletedAppt.patientId;
                const doc = deletedAppt.doctorId;
                const cli = await Clinic.findById(deletedAppt.clinicId);
                const cancelData = {
                  clinicName: cli ? cli.name : 'Our Clinic',
                  clinicPhone: cli ? cli.phone : '',
                  appointmentId: deletedAppt._id.toString(),
                  appointmentDate: deletedAppt.appointmentDate.toLocaleDateString(),
                  appointmentTime: deletedAppt.appointmentTime
                };
                if (pat && pat.email) NotificationService.sendCancellationNotification(cancelData, pat.email, `${pat.firstName} ${pat.lastName}`);
                if (doc && doc.email) NotificationService.sendCancellationNotification(cancelData, doc.email, doc.name);
              } catch (err) {
                console.error('[SyncController Delete Notification Error]', err.message);
              }
            }
            break;
        }
      } catch (applyErr) {
         console.warn(`[CloudSync] Error applying event ${event.id} to Mongoose:`, applyErr.message);
      }
      processedCount++;
    }

    res.status(200).json({ status: 'success', processed: processedCount });
  } catch (err) {
    console.error('Push error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

exports.pullEvents = async (req, res, next) => {
  try {
    const { since } = req.query;
    let query = {};
    if (since && since !== 'null' && since !== '0') {
      query.created_at = { $gt: new Date(since) };
    }
    const events = await Event.find(query).sort({ created_at: 1 });
    
    // Convert _id to id so it matches local sqlite
    const formattedEvents = events.map(e => {
      const obj = e.toObject();
      obj.id = obj._id;
      delete obj._id;
      delete obj.__v;
      return obj;
    });

    res.status(200).json({ status: 'success', events: formattedEvents });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
