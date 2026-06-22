const Event = require('./sync.model');
const Clinic = require('../clinics/clinic.model');
const User = require('../users/user.model');
const Doctor = require('../doctors/doctor.model');
const Patient = require('../patients/patient.model');
const Appointment = require('../appointments/appointment.model');

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
          case 'AppointmentCreated':
            await Appointment.create({
              _id: event.entity_id,
              patientId: payload.patientId || payload.patient_id,
              doctorId: payload.doctorId || payload.doctor_id,
              appointmentDate: new Date(payload.appointmentDate || payload.appointment_date),
              appointmentTime: payload.appointmentTime || payload.appointment_time,
              status: payload.status || 'scheduled',
              reason: payload.reason,
              clinicId: payload.clinicId || payload.clinic_id || 'default_clinic_id' // Ensure a clinic ID exists for schema validation
            });
            break;
          case 'AppointmentUpdated':
            await Appointment.findByIdAndUpdate(event.entity_id, {
              status: payload.status,
              reason: payload.reason,
              appointmentDate: new Date(payload.appointmentDate),
              appointmentTime: payload.appointmentTime
            });
            break;
          case 'AppointmentDeleted':
            await Appointment.findByIdAndDelete(event.entity_id);
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
