const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../middlewares/auth');

router.post('/flush', protect, async (req, res) => {
  try {
    const queue = db.prepare('SELECT * FROM sync_queue WHERE status = ? ORDER BY created_at ASC').all('pending');
    let successCount = 0;
    let failCount = 0;

    for (const item of queue) {
      try {
        const user = db.prepare('SELECT cloud_token FROM users WHERE id = ?').get(item.created_by);
        if (!user || !user.cloud_token) {
          throw new Error('No cloud token found for user');
        }

        const cloudRes = await fetch(`http://localhost:5000/api/v1${item.endpoint}`, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.cloud_token}`
          },
          body: item.payload
        });

        const cloudData = await cloudRes.json();

        if (cloudRes.ok && cloudData.success !== false) {
          db.prepare('UPDATE sync_queue SET status = ?, error_message = ? WHERE id = ?').run('completed', '', item.id);
          successCount++;
        } else {
          const errMsg = cloudData.message || `Cloud returned ${cloudRes.status}`;
          const isPermanentError = (cloudRes.status >= 400 && cloudRes.status < 500) || item.retry_count >= 3;
          const newStatus = isPermanentError ? 'failed' : 'pending';
          db.prepare('UPDATE sync_queue SET status = ?, error_message = ?, retry_count = retry_count + 1 WHERE id = ?').run(newStatus, errMsg, item.id);
          failCount++;
        }
      } catch (err) {
        const isPermanentError = item.retry_count >= 3;
        const newStatus = isPermanentError ? 'failed' : 'pending';
        db.prepare('UPDATE sync_queue SET status = ?, error_message = ?, retry_count = retry_count + 1 WHERE id = ?').run(newStatus, err.message, item.id);
        failCount++;
      }
    }

    res.json({ success: true, message: `Synced ${successCount} items. ${failCount} failed.`, data: { successCount, failCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /pending returns count of pending items
router.get('/pending', protect, (req, res) => {
  try {
    const count = db.prepare('SELECT COUNT(*) as count FROM sync_queue WHERE status = ?').get('pending').count;
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /downstream pulls data from cloud to local DB
router.post('/downstream', protect, async (req, res) => {
  try {
    const user = db.prepare('SELECT cloud_token FROM users WHERE id = ?').get(req.user.id);
    if (!user || !user.cloud_token) throw new Error('No cloud token found for user');

    const headers = { 'Authorization': `Bearer ${user.cloud_token}`, 'Content-Type': 'application/json' };

    // Helper to fetch from cloud
    const fetchCloud = async (endpoint) => {
      const response = await fetch(`http://localhost:5000/api/v1${endpoint}`, { headers });
      const data = await response.json();
      return data.success ? data.data : null;
    };

    const [patientsData, doctorsData, appointmentsData] = await Promise.all([
      fetchCloud('/patients'),
      fetchCloud('/doctors'),
      fetchCloud('/appointments?limit=1000')
    ]);

    // Disable foreign keys temporarily during sync
    db.pragma('foreign_keys = OFF');

    let upsertCount = 0;

    // Process Patients
    if (patientsData && patientsData.patients) {
      const getLocal = db.prepare('SELECT updated_at FROM patients WHERE id = ?');
      const upsert = db.prepare(`
        INSERT INTO patients (id, clinic_id, patient_code, first_name, last_name, phone, email, date_of_birth, gender, blood_group, created_by, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET 
        first_name=excluded.first_name, last_name=excluded.last_name, phone=excluded.phone, email=excluded.email, date_of_birth=excluded.date_of_birth, gender=excluded.gender, blood_group=excluded.blood_group, updated_at=excluded.updated_at
      `);
      db.transaction(() => {
        for (const p of patientsData.patients) {
          const local = getLocal.get(p._id);
          const cloudDate = new Date(p.updatedAt).getTime();
          const localDate = local ? new Date(local.updated_at).getTime() : 0;
          if (!local || cloudDate > localDate) {
            upsert.run(p._id, p.clinicId, p.patientId, p.firstName, p.lastName, p.phone, p.email || '', p.dateOfBirth, p.gender, p.bloodGroup || '', p.createdBy?._id || p.createdBy, p.updatedAt);
            upsertCount++;
          }
        }
      })();
    }

    // Process Doctors
    if (doctorsData && doctorsData.doctors) {
      const getLocal = db.prepare('SELECT updated_at FROM doctors WHERE id = ?');
      const upsert = db.prepare(`
        INSERT INTO doctors (id, clinic_id, doctor_code, name, email, phone, specialization, qualification, experience, is_active, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET 
        name=excluded.name, email=excluded.email, phone=excluded.phone, specialization=excluded.specialization, qualification=excluded.qualification, experience=excluded.experience, is_active=excluded.is_active, updated_at=excluded.updated_at
      `);
      db.transaction(() => {
        for (const d of doctorsData.doctors) {
          const local = getLocal.get(d._id);
          const cloudDate = new Date(d.updatedAt).getTime();
          const localDate = local ? new Date(local.updated_at).getTime() : 0;
          if (!local || cloudDate > localDate) {
            upsert.run(d._id, d.clinicId, d.doctorCode || `DOC-${d._id.substring(0,4)}`, d.name, d.email, d.phone, d.specialization, d.qualification, d.experience || 0, d.isActive ? 1 : 0, d.updatedAt);
            upsertCount++;
          }
        }
      })();
    }

    // Process Appointments
    if (appointmentsData && appointmentsData.appointments) {
      const getLocal = db.prepare('SELECT updated_at FROM appointments WHERE id = ?');
      const upsert = db.prepare(`
        INSERT INTO appointments (id, clinic_id, patient_id, doctor_id, appointment_date, appointment_time, status, reason, created_by, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET 
        appointment_date=excluded.appointment_date, appointment_time=excluded.appointment_time, status=excluded.status, reason=excluded.reason, updated_at=excluded.updated_at
      `);
      db.transaction(() => {
        for (const a of appointmentsData.appointments) {
          const local = getLocal.get(a._id);
          const cloudDate = new Date(a.updatedAt).getTime();
          const localDate = local ? new Date(local.updated_at).getTime() : 0;
          if (!local || cloudDate > localDate) {
            upsert.run(a._id, a.clinicId, a.patientId?._id || a.patientId, a.doctorId?._id || a.doctorId, a.appointmentDate, a.appointmentTime, a.status, a.reason || '', a.createdBy?._id || a.createdBy, a.updatedAt);
            upsertCount++;
          }
        }
      })();
    }

    // Re-enable foreign keys
    db.pragma('foreign_keys = ON');

    res.json({ success: true, message: `Downstream sync complete. Upserted ${upsertCount} records.` });
  } catch (error) {
    db.pragma('foreign_keys = ON'); // ensure re-enabled on error
    console.error('Downstream sync error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
