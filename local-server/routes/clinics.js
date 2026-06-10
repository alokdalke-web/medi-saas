const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middlewares/auth');

router.get('/my-clinic', protect, (req, res) => {
  try {
    const clinic = db.prepare('SELECT * FROM clinics LIMIT 1').get();
    res.json({
      success: true,
      data: clinic ? { _id: clinic.id, name: clinic.name, address: clinic.address, phone: clinic.phone } : { name: "ClinicFlow Local" }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
