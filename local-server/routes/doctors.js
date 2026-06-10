const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middlewares/auth');
const { ObjectId } = require('bson');

router.get('/', protect, (req, res) => {
  try {
    const doctorsRaw = db.prepare('SELECT * FROM doctors ORDER BY name ASC').all();
    const doctors = doctorsRaw.map(d => ({
      _id: d.id,
      doctorCode: d.doctor_code,
      name: d.name,
      specialization: d.specialization,
      experience: d.experience,
      isActive: d.is_active === 1,
      phone: d.phone
    }));
    res.json({ success: true, data: { doctors } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, (req, res) => {
  const { name, specialization, phone, email, qualification, experience } = req.body;
  try {
    const id = new ObjectId().toString();
    const doctorCode = `DOC-${Math.floor(Math.random() * 1000)}`;
    const stmt = db.prepare('INSERT INTO doctors (id, doctor_code, name, email, phone, specialization, qualification, experience) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    stmt.run(id, doctorCode, name, email || 'doc@clinic.com', phone || '', specialization || 'General', qualification || 'MBBS', experience || 0);
    res.status(201).json({
      success: true,
      data: {
        doctor: {
          _id: id,
          name,
          specialization,
          phone
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
