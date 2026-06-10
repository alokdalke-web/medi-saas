const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middlewares/auth');

router.get('/', protect, async (req, res) => {
  try {
    const role = req.user.role;
    const userName = req.user.name;
    let stats = {};

    // 2. Fetch stats based on user role
    if (role === 'admin' || role === 'clinic_admin') {
      const totalPatients = db.prepare('SELECT COUNT(*) as count FROM patients').get().count;
      const totalDoctors = db.prepare('SELECT COUNT(*) as count FROM doctors').get().count;
      const totalAppointments = db.prepare('SELECT COUNT(*) as count FROM appointments').get().count;
      
      const recentAppointments = db.prepare(`
        SELECT appointments.*, patients.first_name, patients.last_name, doctors.name as doctor_name
        FROM appointments
        LEFT JOIN patients ON appointments.patient_id = patients.id
        LEFT JOIN doctors ON appointments.doctor_id = doctors.id
        ORDER BY appointment_date DESC
        LIMIT 5
      `).all().map(apt => ({
        _id: apt.id,
        patientId: { firstName: apt.first_name || 'Unknown', lastName: apt.last_name || '' },
        doctorId: { name: apt.doctor_name || 'Unassigned' },
        appointmentDate: apt.appointment_date,
        status: apt.status
      }));

      stats = { totalPatients, totalDoctors, totalAppointments, recentAppointments };
    } 
    else if (role === 'doctor') {
      const doctor = db.prepare('SELECT * FROM doctors WHERE name = ?').get(userName);
      const doctorId = doctor ? doctor.id : -1;

      const todaysAppointments = db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND date(appointment_date) = date('now', 'localtime')`).get(doctorId).count;
      const totalPatientsTreated = db.prepare(`SELECT COUNT(DISTINCT patient_id) as count FROM appointments WHERE doctor_id = ? AND status = 'completed'`).get(doctorId).count;
      
      const upcomingAppointments = db.prepare(`
        SELECT appointments.*, patients.first_name, patients.last_name, patients.phone as patient_phone, patients.gender as patient_gender
        FROM appointments
        LEFT JOIN patients ON appointments.patient_id = patients.id
        WHERE doctor_id = ? AND date(appointment_date) >= date('now', 'localtime') AND status IN ('scheduled', 'checked_in')
        ORDER BY appointment_date ASC
        LIMIT 5
      `).all().map(apt => ({
        _id: apt.id,
        patientId: { firstName: apt.first_name, lastName: apt.last_name, gender: apt.patient_gender, phone: apt.patient_phone },
        appointmentDate: apt.appointment_date,
        appointmentTime: apt.appointment_time,
        status: apt.status
      }));

      stats = { todaysAppointments, totalPatientsTreated, upcomingAppointments };
    }
    else if (role === 'receptionist') {
      const totalToday = db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE date(appointment_date) = date('now', 'localtime')`).get().count;
      const checkedInToday = db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE date(appointment_date) = date('now', 'localtime') AND status = 'checked_in'`).get().count;
      const scheduledToday = db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE date(appointment_date) = date('now', 'localtime') AND status = 'scheduled'`).get().count;
      
      const todayQueue = db.prepare(`
        SELECT appointments.*, patients.first_name, patients.last_name, patients.phone as patient_phone, doctors.name as doctor_name, doctors.specialization
        FROM appointments
        LEFT JOIN patients ON appointments.patient_id = patients.id
        LEFT JOIN doctors ON appointments.doctor_id = doctors.id
        WHERE date(appointment_date) = date('now', 'localtime')
        ORDER BY appointment_date ASC
      `).all().map(apt => ({
        _id: apt.id,
        patientId: { firstName: apt.first_name, lastName: apt.last_name, phone: apt.patient_phone },
        doctorId: { name: apt.doctor_name, specialization: apt.specialization },
        appointmentDate: apt.appointment_date,
        appointmentTime: apt.appointment_time,
        status: apt.status
      }));

      stats = { totalToday, checkedInToday, scheduledToday, todayQueue };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
