const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middlewares/auth');
const { ObjectId } = require('bson');

// Get all patients
router.get('/', protect, (req, res) => {
  try {
    const patientsRaw = db.prepare('SELECT * FROM patients WHERE is_deleted = 0 ORDER BY created_at DESC').all();
    const patients = patientsRaw.map(p => ({
      _id: p.id,
      patientId: p.patient_code,
      firstName: p.first_name,
      lastName: p.last_name,
      phone: p.phone,
      email: p.email,
      gender: p.gender,
      dateOfBirth: p.date_of_birth,
      bloodGroup: p.blood_group
    }));
    res.json({ success: true, data: { patients } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new patient
router.post('/', protect, (req, res) => {
  const { firstName, lastName, phone, email, dateOfBirth, gender, bloodGroup } = req.body;
  try {
    const id = new ObjectId().toString();
    const patientCode = `PAT-${Math.floor(Math.random() * 10000)}`;
    
    const stmt = db.prepare('INSERT INTO patients (id, patient_code, first_name, last_name, phone, email, date_of_birth, gender, blood_group, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, patientCode, firstName, lastName, phone, email, dateOfBirth, gender, bloodGroup || '', req.user.id);
    
    res.status(201).json({ 
      success: true, 
      data: { patient: { _id: id, patientId: patientCode, firstName, lastName, phone, email, dateOfBirth, gender } } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
