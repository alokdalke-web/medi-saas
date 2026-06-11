const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middlewares/auth');
const { ObjectId } = require('bson');
const { addToSyncQueue } = require('../utils/syncQueue');

// Get all appointments
router.get('/', protect, (req, res) => {
  try {
    const appointmentsRaw = db.prepare(`
      SELECT appointments.*, patients.first_name, patients.last_name, doctors.name as doctor_name 
      FROM appointments 
      LEFT JOIN patients ON appointments.patient_id = patients.id 
      LEFT JOIN doctors ON appointments.doctor_id = doctors.id 
      ORDER BY appointment_date DESC
    `).all();
    
    const appointments = appointmentsRaw.map(a => ({
      _id: a.id,
      patientId: { _id: a.patient_id, firstName: a.first_name || 'Unknown', lastName: a.last_name || '' },
      doctorId: { _id: a.doctor_id, name: a.doctor_name || 'Unassigned' },
      appointmentDate: a.appointment_date,
      appointmentTime: a.appointment_time,
      status: a.status,
      reason: a.reason
    }));
    
    res.json({ success: true, data: { appointments } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create appointment
router.post('/', protect, (req, res) => {
  const { patientId, doctorId, appointmentDate, appointmentTime, status, reason } = req.body;
  try {
    const id = new ObjectId().toString();
    const stmt = db.prepare('INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, status, reason, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, patientId, doctorId, appointmentDate, appointmentTime || '09:00', status || 'scheduled', reason || '', req.user.id);
    
    // Add to sync queue
    addToSyncQueue('POST', '/appointments', { _id: id, ...req.body }, req.user.id);

    res.status(201).json({ success: true, data: { appointment: { _id: id, ...req.body } } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update appointment status
router.put('/:id', protect, (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  try {
    const stmt = db.prepare('UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    const info = stmt.run(status, id);
    if (info.changes === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    // Add to sync queue
    addToSyncQueue('PUT', `/appointments/${id}`, { status }, req.user.id);

    res.json({ success: true, data: { appointment: { _id: id, status } } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
