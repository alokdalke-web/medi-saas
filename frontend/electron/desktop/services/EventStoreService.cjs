const dbService = require('../database/DatabaseService.cjs');
const ipcNotifier = require('../api/IpcNotifier.cjs');
const crypto = require('crypto');
const { parseTimeToMinutes, checkTimeOverlap } = require('../utils/timeUtils.cjs');

let nodeId = 'PENDING_NODE_ID';
let currentClock = 0;

/**
 * Initializes the event store service.
 * @param {string} id - The unique identity of this node.
 */
function initialize(id) {
  nodeId = id;
  const db = dbService.getDb();

  try {
    const result = db.prepare('SELECT MAX(logical_clock) as maxClock FROM events').get();
    currentClock = result?.maxClock || 0;
  } catch (e) {
    currentClock = 0;
  }

  console.log(`[EventStoreService] Initialized with Node ID: ${nodeId}, Logical Clock: ${currentClock}`);
}

/**
 * Phase 2, 8 & 9: Saves an event to the local database and immediately applies it.
 * Includes OCC validation and automatically generates an audit log.
 */
function saveEvent(eventType, entityType, entityId, payload, expectedVersion = 0, userId = null) {
  const db = dbService.getDb();
  const eventId = crypto.randomUUID();

  // Phase 8: Optimistic Concurrency Control Check
  const record = db.prepare('SELECT MAX(version) as maxVer FROM events WHERE entity_id = ?').get(entityId);
  const currentVersion = record.maxVer || 0;

  if (currentVersion !== expectedVersion) {
    throw new Error(`Conflict Detected: Expected version ${expectedVersion}, but found ${currentVersion}`);
  }

  // Lamport Clock: Increment on local write
  currentClock += 1;

  const event = {
    id: eventId,
    node_id: nodeId,
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    payload: JSON.stringify(payload),
    version: currentVersion + 1, // Phase 8: Increment version
    logical_clock: currentClock,
    synced: 0,
    created_at: new Date().toISOString()
  };

  console.log(`[EventStoreService] Saving event: ${eventType} for ${entityType} ${entityId} (Clock: ${currentClock})`);

  // Start a transaction so either both the event and the entity are saved, or neither.
  const transaction = db.transaction(() => {
    // 1. Insert into events table
    db.prepare(`
        INSERT INTO events (id, node_id, event_type, entity_type, entity_id, payload, version, logical_clock, synced, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(event.id, event.node_id, event.event_type, event.entity_type, event.entity_id, event.payload, event.version, event.logical_clock, event.synced, event.created_at);

    // 2. Immediately apply it to the local schema
    applyRemoteEvent(event);
  });

  transaction();

  return eventId;
}

/**
 * Phase 4: Saves an event received from a remote peer and applies it if it's new.
 */
function saveRemoteEvent(event) {
  const db = dbService.getDb();

  // Check if we already have this event
  const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(event.id);
  if (existing) {
    return; // Already processed
  }

  console.log(`[EventStoreService] Saving incoming remote event: ${event.event_type} (${event.id})`);

  // Lamport Clock: Fast-forward on remote write
  currentClock = Math.max(currentClock, event.logical_clock || 0) + 1;

  const transaction = db.transaction(() => {
    // Insert into local events table
    db.prepare(`
        INSERT INTO events (id, node_id, event_type, entity_type, entity_id, payload, version, logical_clock, synced, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
      event.id,
      event.node_id,
      event.event_type,
      event.entity_type,
      event.entity_id,
      event.payload,
      event.version,
      event.logical_clock || 0,
      1, // Mark as synced since it came from another node
      event.created_at
    );

    // Apply the actual data change
    applyRemoteEvent(event);
  });

  transaction();

  // Phase 6: Notify the React UI that new data has been synced
  ipcNotifier.notifyFrontend('sync-update', {
    eventType: event.event_type,
    entityType: event.entity_type
  });
}

/**
 * Phase 2: Applies an event to the local tables. Used both for local writes and incoming remote events.
 */
function applyRemoteEvent(event) {
  const db = dbService.getDb();
  
  // Phase 14: Last-Write-Wins (LWW) Conflict Resolution
  // Only apply this event if it is the absolutely newest event we know about for this entity.
  // We use logical_clock, breaking ties with node_id to ensure determinism across the P2P mesh.
  try {
    const latestEvent = db.prepare(`
      SELECT id 
      FROM events 
      WHERE entity_id = ? 
      ORDER BY logical_clock DESC, node_id DESC 
      LIMIT 1
    `).get(event.entity_id);

    if (latestEvent && latestEvent.id !== event.id) {
      console.log(`[LWW] Skipping apply for event ${event.id}. A newer event (${latestEvent.id}) already governs entity ${event.entity_id}.`);
      return;
    }
  } catch (e) {
    console.error(`[LWW] Error during conflict check for ${event.id}:`, e.message);
  }

  const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;

  console.log(`[EventStoreService] Applying event: ${event.event_type} (${event.id})`);

  switch (event.event_type) {
    case 'ClinicCreated':
      db.prepare(`
          INSERT INTO clinics (id, name, email, phone) 
          VALUES (?, ?, ?, ?)
        `).run(event.entity_id, payload.name, payload.email, payload.phone);
      break;

    case 'ClinicUpdated': {
      const exists = db.prepare('SELECT id FROM clinics WHERE id = ?').get(event.entity_id);
      if (exists) {
        db.prepare(`
            UPDATE clinics 
            SET name = ?, email = ?, phone = ?, logo = COALESCE(?, logo),
                address_street = COALESCE(?, address_street),
                address_city = COALESCE(?, address_city),
                address_state = COALESCE(?, address_state),
                address_country = COALESCE(?, address_country),
                address_pincode = COALESCE(?, address_pincode)
            WHERE id = ?
          `).run(
            payload.name, payload.email, payload.phone, payload.logo || null,
            payload.address?.street || null, payload.address?.city || null,
            payload.address?.state || null, payload.address?.country || null,
            payload.address?.pincode || null,
            event.entity_id
          );
      } else {
        db.prepare(`
            INSERT INTO clinics (id, name, email, phone, logo, address_street, address_city, address_state, address_country, address_pincode)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            event.entity_id, payload.name, payload.email, payload.phone, payload.logo || null,
            payload.address?.street || null, payload.address?.city || null,
            payload.address?.state || null, payload.address?.country || null,
            payload.address?.pincode || null
          );
      }
      break;
    }

    // ----------------------------------------------------------------------
    // Phase 13: Extended CRUD Mappings
    // ----------------------------------------------------------------------

    case 'PatientCreated':
      db.prepare(`
          INSERT INTO patients (id, patient_code, first_name, last_name, gender, date_of_birth, phone, email, blood_group, address_street, address_city, address_state, address_country, address_pincode, emergency_name, emergency_phone, emergency_rel)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
        event.entity_id, payload.patientId || `PAT-${Date.now()}`, payload.firstName, payload.lastName, payload.gender,
        payload.dateOfBirth, payload.phone, payload.email || '', payload.bloodGroup || '',
        payload.address?.street || '', payload.address?.city || '', payload.address?.state || '',
        payload.address?.country || '', payload.address?.pincode || '',
        payload.emergencyContact?.name || '', payload.emergencyContact?.phone || '', payload.emergencyContact?.relation || ''
      );
      break;
    case 'PatientUpdated':
      db.prepare(`
          UPDATE patients SET first_name=?, last_name=?, gender=?, date_of_birth=?, phone=?, email=?, blood_group=?, address_street=?, address_city=?, address_state=?, address_country=?, address_pincode=?, emergency_name=?, emergency_phone=?, emergency_rel=?
          WHERE id=?
        `).run(
        payload.firstName, payload.lastName, payload.gender, payload.dateOfBirth, payload.phone,
        payload.email || '', payload.bloodGroup || '',
        payload.address?.street || '', payload.address?.city || '', payload.address?.state || '',
        payload.address?.country || '', payload.address?.pincode || '',
        payload.emergencyContact?.name || '', payload.emergencyContact?.phone || '', payload.emergencyContact?.relation || '',
        event.entity_id
      );
      break;
    case 'PatientDeleted':
      db.prepare(`UPDATE patients SET is_deleted=1, deleted_at=CURRENT_TIMESTAMP WHERE id=?`).run(event.entity_id);
      break;

    case 'DoctorCreated':
      db.prepare(`
          INSERT INTO doctors (id, doctor_code, name, email, phone, specialization, qualification, experience, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
        event.entity_id, payload.doctorCode || `DOC-${Date.now()}`, payload.name, payload.email, payload.phone,
        payload.specialization, payload.qualification, payload.experience, payload.isActive === false ? 0 : 1
      );
      break;
    case 'DoctorUpdated':
      db.prepare(`
          UPDATE doctors SET name=?, email=?, phone=?, specialization=?, qualification=?, experience=?, is_active=?
          WHERE id=?
        `).run(
        payload.name, payload.email, payload.phone, payload.specialization, payload.qualification, payload.experience,
        payload.isActive === false ? 0 : 1, event.entity_id
      );
      break;
    case 'DoctorDeleted':
      db.prepare(`UPDATE doctors SET is_deleted=1, deleted_at=CURRENT_TIMESTAMP WHERE id=?`).run(event.entity_id);
      break;

    case 'UserCreated':
      db.prepare(`
          INSERT INTO users (id, name, email, phone, role, password, is_active, profile_picture)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
        event.entity_id, payload.name, payload.email, payload.phone || '', payload.role || 'receptionist',
        payload.password || 'temp_pass', payload.isActive === false ? 0 : 1, payload.profile_picture || ''
      );
      break;
    case 'UserUpdated': {
      let updateFields = ['name=?', 'email=?', 'phone=?', 'role=?', 'is_active=?'];
      let updateParams = [
        payload.name, payload.email, payload.phone || '', payload.role || 'receptionist',
        payload.isActive === false ? 0 : 1
      ];

      if (payload.password) {
        updateFields.push('password=?');
        updateParams.push(payload.password);
      }
      
      if (payload.profile_picture !== undefined) {
        updateFields.push('profile_picture=?');
        updateParams.push(payload.profile_picture || '');
      }
      
      updateParams.push(event.entity_id);

      db.prepare(`
          UPDATE users SET ${updateFields.join(', ')}
          WHERE id=?
        `).run(...updateParams);
      break;
    }
    case 'UserDeleted':
      db.prepare(`UPDATE users SET is_deleted=1, deleted_at=CURRENT_TIMESTAMP WHERE id=?`).run(event.entity_id);
      break;

    case 'AppointmentCreated': {
      let finalStatus = payload.status || 'scheduled';

      // Conflict Check (Winner-Takes-All algorithm using Logical Clocks)
      const existingDayAppts = db.prepare(`
          SELECT id, logical_clock, node_id, appointment_time FROM appointments 
          WHERE doctor_id = ? AND appointment_date = ? 
          AND status NOT IN ('cancelled', 'waitlisted')
        `).all(payload.doctorId, payload.appointmentDate);

      const conflict = existingDayAppts.find(appt => 
        checkTimeOverlap(payload.appointmentTime, appt.appointment_time, 30, 30)
      );

      if (conflict) {
        const incomingClock = event.logical_clock || 0;
        const existingClock = conflict.logical_clock || 0;

        let incomingWins = false;

        if (incomingClock < existingClock) {
          // Rule 1: Lower clock means it happened earlier
          incomingWins = true;
        } else if (incomingClock === existingClock) {
          // Rule 2 (Tie-Breaker): Compare Node IDs alphabetically
          if (event.node_id < conflict.node_id) {
            incomingWins = true;
          }
        }

        if (incomingWins) {
          // Incoming wins! Waitlist the existing one.
          db.prepare("UPDATE appointments SET status = 'waitlisted' WHERE id = ?").run(conflict.id);
          console.log(`[Conflict Resolution] Incoming appointment ${event.entity_id} won (Clock: ${incomingClock}). Existing appointment ${conflict.id} waitlisted.`);
        } else {
          // Existing wins! Waitlist the incoming one.
          finalStatus = 'waitlisted';
          console.log(`[Conflict Resolution] Existing appointment ${conflict.id} won (Clock: ${existingClock}). Incoming appointment ${event.entity_id} waitlisted.`);
        }
      }

      db.prepare(`
          INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, status, reason, logical_clock, node_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
        event.entity_id, payload.patientId, payload.doctorId, payload.appointmentDate,
        payload.appointmentTime, finalStatus, payload.reason || '', event.logical_clock || 0, event.node_id, event.created_at || new Date().toISOString()
      );
      break;
    }
    case 'AppointmentUpdated':
      db.prepare(`
          UPDATE appointments SET status=?, reason=?, appointment_date=?, appointment_time=?
          WHERE id=?
        `).run(
        payload.status, payload.reason || '', payload.appointmentDate, payload.appointmentTime, event.entity_id
      );
      break;
    case 'AppointmentDeleted':
      db.prepare(`UPDATE appointments SET is_deleted=1, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(event.entity_id);
      break;

    case 'MedicalRecordCreated':
      db.prepare(`
          INSERT INTO medical_records (id, clinic_id, patient_id, doctor_id, record_type, content)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
        event.entity_id,
        payload.clinicId || payload.clinic_id || null,
        payload.patientId || payload.patient_id,
        payload.doctorId || payload.doctor_id,
        payload.recordType || payload.record_type,
        typeof payload.content === 'object' ? JSON.stringify(payload.content) : payload.content
      );
      break;
    case 'MedicalRecordUpdated':
      db.prepare(`
          UPDATE medical_records SET content=?
          WHERE id=?
        `).run(
        typeof payload.content === 'object' ? JSON.stringify(payload.content) : payload.content,
        event.entity_id
      );
      break;
    case 'MedicalRecordDeleted':
      db.prepare(`UPDATE medical_records SET is_deleted=1, deleted_at=CURRENT_TIMESTAMP WHERE id=?`).run(event.entity_id);
      break;

    case 'BillingCreated':
      db.prepare(`
          INSERT INTO billing (id, billing_id, clinic_id, patient_id, appointment_id, amount, status, payment_method, issued_date, due_date, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
        event.entity_id,
        payload.billingId || `INV-${Date.now()}`,
        payload.clinicId || payload.clinic_id || null,
        payload.patientId || payload.patient_id,
        payload.appointmentId || payload.appointment_id || null,
        payload.amount,
        payload.status || 'pending',
        payload.paymentMethod || payload.payment_method || 'Cash',
        payload.issuedDate || payload.issued_date || new Date().toISOString(),
        payload.dueDate || payload.due_date || null,
        payload.notes || ''
      );
      break;
    case 'BillingUpdated':
      db.prepare(`
          UPDATE billing SET amount=?, status=?, payment_method=?, due_date=?, notes=?
          WHERE id=?
        `).run(
        payload.amount,
        payload.status,
        payload.paymentMethod || payload.payment_method,
        payload.dueDate || payload.due_date,
        payload.notes || '',
        event.entity_id
      );
      break;
    case 'BillingDeleted':
      db.prepare(`UPDATE billing SET is_deleted=1, deleted_at=CURRENT_TIMESTAMP WHERE id=?`).run(event.entity_id);
      break;

    default:
      console.warn(`[EventStoreService] Unknown event_type: ${event.event_type}`);
  }
}

module.exports = {
  initialize,
  saveEvent,
  saveRemoteEvent,
  applyRemoteEvent
};
