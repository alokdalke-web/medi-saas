const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let dbInstance = null;

function initialize() {
  // Get the user data path where the app can write data securely
  const userDataPath = app.getPath('userData');
  const dbFileName = process.env.DB_NAME || 'clinicflow-local.db';
  const dbPath = path.join(userDataPath, dbFileName);

  console.log(`[DatabaseService] Initializing database at: ${dbPath}`);

  // Connect to better-sqlite3 database
  dbInstance = new Database(dbPath);
  dbInstance.pragma('journal_mode = WAL'); // Better performance and concurrency

  initializeSchema();
  return dbInstance;
}

function initializeSchema() {
  if (!dbInstance) throw new Error("Database not initialized");

  console.log("[DatabaseService] Running schema migrations...");

  // Create the schema. This mirrors the previous local-server but adds the upcoming tables 
  // from the PRD for Phase 2 (Events), Phase 7 (Sync Checkpoints) and Phase 9 (Audit)
  dbInstance.exec(`
      -- Old Schema Tables
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
        profile_picture TEXT DEFAULT '',
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
        logical_clock INTEGER DEFAULT 0,
        node_id TEXT,
        is_deleted INTEGER DEFAULT 0,
        deleted_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (clinic_id) REFERENCES clinics(id),
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (doctor_id) REFERENCES doctors(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS medical_records (
        id TEXT PRIMARY KEY,
        clinic_id TEXT,
        patient_id TEXT,
        doctor_id TEXT,
        record_type TEXT NOT NULL,
        content TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0,
        deleted_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (clinic_id) REFERENCES clinics(id),
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (doctor_id) REFERENCES doctors(id)
      );

      CREATE TABLE IF NOT EXISTS billing (
        id TEXT PRIMARY KEY,
        billing_id TEXT UNIQUE,
        clinic_id TEXT,
        patient_id TEXT,
        appointment_id TEXT,
        amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_method TEXT DEFAULT 'Cash',
        issued_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        due_date DATETIME,
        notes TEXT,
        is_deleted INTEGER DEFAULT 0,
        deleted_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (clinic_id) REFERENCES clinics(id),
        FOREIGN KEY (patient_id) REFERENCES patients(id),
        FOREIGN KEY (appointment_id) REFERENCES appointments(id)
      );

      -- Upcoming Peer-to-Peer Event Store (Phase 2)
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        node_id TEXT,
        event_type TEXT,
        entity_type TEXT,
        entity_id TEXT,
        payload TEXT,
        version INTEGER,
        logical_clock INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        cloud_synced INTEGER DEFAULT 0
      );

      -- Upcoming Sync State Checkpoints (Phase 7)
      CREATE TABLE IF NOT EXISTS sync_state (
        peer_id TEXT PRIMARY KEY,
        last_event_id TEXT,
        last_sync_at DATETIME
      );

      -- Upcoming Audit Logs (Phase 9)
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        node_id TEXT,
        action TEXT,
        entity TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

  try {
    dbInstance.exec(`ALTER TABLE appointments ADD COLUMN logical_clock INTEGER DEFAULT 0;`);
    dbInstance.exec(`ALTER TABLE appointments ADD COLUMN node_id TEXT;`);
  } catch (e) { /* Column already exists */ }

  try {
    dbInstance.prepare('ALTER TABLE appointments ADD COLUMN is_deleted INTEGER DEFAULT 0').run();
    dbInstance.prepare('ALTER TABLE appointments ADD COLUMN deleted_at DATETIME').run();
    console.log('[DatabaseService] Added is_deleted and deleted_at columns to appointments table.');
  } catch (err) {
    // Ignore if columns already exist
  }

  try {
    dbInstance.prepare('ALTER TABLE users ADD COLUMN profile_picture TEXT DEFAULT ""').run();
    console.log('[DatabaseService] Added profile_picture column to users table.');
  } catch (err) {
    // Ignore if column already exists
  }

  console.log("[DatabaseService] Schema initialized successfully");
}

// Helper function to get database instance
function getDb() {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initialize() first.");
  }
  return dbInstance;
}

module.exports = { initialize, initializeSchema, getDb };
