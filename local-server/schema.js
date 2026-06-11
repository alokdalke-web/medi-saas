const db = require('./db');
const { ObjectId } = require('bson');

function initializeSchema() {
  // Tables are created only if they don't exist to prevent wiping data on restart

  db.exec(`
    CREATE TABLE IF NOT EXISTS clinics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address_street TEXT DEFAULT '',
      address_city TEXT DEFAULT '',
      address_state TEXT DEFAULT '',
      address_country TEXT DEFAULT '',
      address_pincode TEXT DEFAULT '',
      logo TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      clinic_id TEXT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT DEFAULT '',
      role TEXT DEFAULT 'clinic_admin',
      is_active INTEGER DEFAULT 1,
      cloud_token TEXT,
      last_login DATETIME,
      is_deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id)
    );

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      clinic_id TEXT,
      patient_code TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      gender TEXT NOT NULL,
      date_of_birth DATETIME NOT NULL,
      phone TEXT NOT NULL,
      email TEXT DEFAULT '',
      blood_group TEXT DEFAULT '',
      address_street TEXT DEFAULT '',
      address_city TEXT DEFAULT '',
      address_state TEXT DEFAULT '',
      address_country TEXT DEFAULT '',
      address_pincode TEXT DEFAULT '',
      emergency_name TEXT DEFAULT '',
      emergency_phone TEXT DEFAULT '',
      emergency_rel TEXT DEFAULT '',
      created_by TEXT,
      is_deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      clinic_id TEXT,
      user_id TEXT,
      doctor_code TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      specialization TEXT NOT NULL,
      qualification TEXT NOT NULL,
      experience INTEGER DEFAULT 0,
      avail_working_days TEXT DEFAULT '["Monday","Tuesday","Wednesday","Thursday","Friday"]',
      avail_start_time TEXT DEFAULT '09:00',
      avail_end_time TEXT DEFAULT '18:00',
      is_active INTEGER DEFAULT 1,
      is_deleted INTEGER DEFAULT 0,
      deleted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      clinic_id TEXT,
      patient_id TEXT,
      doctor_id TEXT,
      appointment_date DATETIME NOT NULL,
      appointment_time TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      queue_number INTEGER DEFAULT 1,
      reason TEXT DEFAULT '',
      checked_in_at DATETIME,
      started_at DATETIME,
      completed_at DATETIME,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clinic_id) REFERENCES clinics(id),
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      retry_count INTEGER DEFAULT 0,
      error_message TEXT DEFAULT '',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Create a default local clinic if none exists
  const existingClinic = db.prepare('SELECT id FROM clinics LIMIT 1').get();
  if (!existingClinic) {
    const defaultClinicId = new ObjectId().toString();
    db.prepare(`
      INSERT INTO clinics (id, name, email, phone) 
      VALUES (?, 'Local Clinic Default', 'contact@localclinic.com', '1234567890')
    `).run(defaultClinicId);
  }
  
  console.log("SQLite Database schema completely aligned with MongoDB.");
}

module.exports = { initializeSchema };
