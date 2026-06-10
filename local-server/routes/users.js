const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middlewares/auth');
const { ObjectId } = require('bson');

router.get('/', protect, (req, res) => {
  try {
    const usersRaw = db.prepare('SELECT * FROM users ORDER BY name ASC').all();
    const users = usersRaw.map(u => ({
      _id: u.id,
      name: u.name,
      firstName: u.name.split(' ')[0],
      lastName: u.name.split(' ').slice(1).join(' '),
      email: u.email,
      role: u.role,
      isActive: true
    }));
    res.json({ success: true, data: { users } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const id = new ObjectId().toString();
    const stmt = db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, name, email, password || 'password', role || 'receptionist');
    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: id,
          name,
          email,
          role: role || 'receptionist'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
