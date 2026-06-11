const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');
const { protect } = require('../middlewares/auth');

// POST /api/v1/auth/login
// Proxies login to cloud, then generates local JWT for offline support
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Authenticate with cloud backend
    const cloudRes = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const cloudData = await cloudRes.json();

    if (!cloudRes.ok || !cloudData.success) {
      return res.status(401).json({ success: false, message: cloudData.message || 'Cloud login failed' });
    }

    const cloudUser = cloudData.data.user;

    // 2. Sync user to local database
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(cloudUser.email);
    let localUserId;
    if (existingUser) {
      db.prepare('UPDATE users SET name = ?, role = ?, cloud_token = ? WHERE email = ?')
        .run(cloudUser.name || cloudUser.firstName, cloudUser.role, cloudData.data.token, cloudUser.email);
      localUserId = existingUser.id;
    } else {
      localUserId = cloudUser._id; // Use Cloud ID directly!
      
      // Ensure clinic exists to satisfy foreign key constraint
      const clinicId = cloudUser.clinicId || '';
      if (clinicId) {
        db.prepare('INSERT OR IGNORE INTO clinics (id, name, email, phone) VALUES (?, ?, ?, ?)')
          .run(clinicId, 'Cloud Synced Clinic', 'admin@clinic.com', '0000000000');
      }

      db.prepare('INSERT INTO users (id, clinic_id, name, email, password, role, cloud_token) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(localUserId, clinicId, cloudUser.name || cloudUser.firstName, cloudUser.email, 'cloud_managed', cloudUser.role, cloudData.data.token);
    }

    // 3. Generate Local JWT
    const token = jwt.sign(
      { id: localUserId, email: cloudUser.email, role: cloudUser.role }, 
      process.env.LOCAL_JWT_SECRET, 
      { expiresIn: process.env.LOCAL_JWT_EXPIRES_IN || '30d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: { id: localUserId, name: cloudUser.name || cloudUser.firstName, email: cloudUser.email, role: cloudUser.role }
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reach cloud backend for login.' });
  }
});

// GET /api/v1/auth/me
// Uses true offline local authentication via JWT
router.get('/me', protect, (req, res) => {
  res.json({
    success: true,
    data: {
      user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role }
    }
  });
});

module.exports = router;
