const dbService = require('../database/DatabaseService.cjs');
const ipcNotifier = require('../api/IpcNotifier.cjs');
const auditService = require('./AuditService.cjs');
const crypto = require('crypto');

class EventStoreService {
  constructor() {
    this.nodeId = 'PENDING_NODE_ID'; // Will be loaded from config in Phase 3
  }

  /**
   * Initializes the event store service.
   * @param {string} nodeId - The unique identity of this node.
   */
  initialize(nodeId) {
    this.nodeId = nodeId;
    console.log(`[EventStoreService] Initialized with Node ID: ${this.nodeId}`);
  }

  /**
   * Phase 2, 8 & 9: Saves an event to the local database and immediately applies it.
   * Includes OCC validation and automatically generates an audit log.
   */
  saveEvent(eventType, entityType, entityId, payload, expectedVersion = 0, userId = null) {
    const db = dbService.getDb();
    const eventId = crypto.randomUUID();
    
    // Phase 8: Optimistic Concurrency Control Check
    const record = db.prepare('SELECT MAX(version) as maxVer FROM events WHERE entity_id = ?').get(entityId);
    const currentVersion = record.maxVer || 0;

    if (currentVersion !== expectedVersion) {
      throw new Error(`Conflict Detected: Expected version ${expectedVersion}, but found ${currentVersion}`);
    }
    
    const event = {
      id: eventId,
      node_id: this.nodeId,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      payload: JSON.stringify(payload),
      version: currentVersion + 1, // Phase 8: Increment version
      synced: 0,
      created_at: new Date().toISOString()
    };

    console.log(`[EventStoreService] Saving event: ${eventType} for ${entityType} ${entityId}`);
    
    // Start a transaction so either both the event and the entity are saved, or neither.
    const transaction = db.transaction(() => {
      // 1. Insert into events table
      db.prepare(`
        INSERT INTO events (id, node_id, event_type, entity_type, entity_id, payload, version, synced, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(event.id, event.node_id, event.event_type, event.entity_type, event.entity_id, event.payload, event.version, event.synced, event.created_at);
      
      // 2. Immediately apply it to the local schema
      this.applyRemoteEvent(event);
      
      // Phase 9: Record Audit Log
      auditService.logAction(userId || 'system', eventType, `${entityType}:${entityId}`);
    });

    transaction();

    return eventId;
  }

  /**
   * Phase 4: Saves an event received from a remote peer and applies it if it's new.
   */
  saveRemoteEvent(event) {
    const db = dbService.getDb();
    
    // Check if we already have this event
    const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(event.id);
    if (existing) {
      return; // Already processed
    }

    console.log(`[EventStoreService] Saving incoming remote event: ${event.event_type} (${event.id})`);
    
    const transaction = db.transaction(() => {
      // Insert into local events table
      db.prepare(`
        INSERT INTO events (id, node_id, event_type, entity_type, entity_id, payload, version, synced, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        event.id, 
        event.node_id, 
        event.event_type, 
        event.entity_type, 
        event.entity_id, 
        event.payload, 
        event.version, 
        1, // Mark as synced since it came from another node
        event.created_at
      );
      
      // Apply the actual data change
      this.applyRemoteEvent(event);
      
      // Phase 9: Record Audit Log for incoming sync
      auditService.logAction('system', `Synced ${event.event_type}`, `${event.entity_type}:${event.entity_id}`);
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
  applyRemoteEvent(event) {
    const db = dbService.getDb();
    const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;

    console.log(`[EventStoreService] Applying event: ${event.event_type} (${event.id})`);

    switch (event.event_type) {
      case 'ClinicCreated':
        db.prepare(`
          INSERT INTO clinics (id, name, email, phone) 
          VALUES (?, ?, ?, ?)
        `).run(event.entity_id, payload.name, payload.email, payload.phone);
        break;
        
      case 'ClinicUpdated':
        db.prepare(`
          UPDATE clinics 
          SET name = ?, email = ?, phone = ?
          WHERE id = ?
        `).run(payload.name, payload.email, payload.phone, event.entity_id);
        break;

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
          INSERT INTO users (id, name, email, phone, role, password, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          event.entity_id, payload.name, payload.email, payload.phone || '', payload.role || 'receptionist', 
          payload.password || 'temp_pass', payload.isActive === false ? 0 : 1
        );
        break;
      case 'UserUpdated':
        db.prepare(`
          UPDATE users SET name=?, email=?, phone=?, role=?, is_active=?
          WHERE id=?
        `).run(
          payload.name, payload.email, payload.phone || '', payload.role || 'receptionist', 
          payload.isActive === false ? 0 : 1, event.entity_id
        );
        break;
      case 'UserDeleted':
        db.prepare(`UPDATE users SET is_deleted=1, deleted_at=CURRENT_TIMESTAMP WHERE id=?`).run(event.entity_id);
        break;

      case 'AppointmentCreated': {
        let finalStatus = payload.status || 'scheduled';
        
        // Conflict Check (Winner-Takes-All algorithm)
        const conflict = db.prepare(`
          SELECT id, created_at FROM appointments 
          WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? 
          AND status NOT IN ('cancelled', 'waitlisted')
        `).get(payload.doctorId, payload.appointmentDate, payload.appointmentTime);

        if (conflict) {
           const incomingTime = new Date(event.created_at || Date.now()).getTime();
           const existingTime = new Date(conflict.created_at || Date.now()).getTime();

           if (incomingTime < existingTime) {
              // Incoming wins! Waitlist the existing one.
              db.prepare("UPDATE appointments SET status = 'waitlisted' WHERE id = ?").run(conflict.id);
              console.log(`[Conflict Resolution] Incoming appointment ${event.entity_id} won. Existing appointment ${conflict.id} waitlisted.`);
           } else {
              // Existing wins! Waitlist the incoming one.
              finalStatus = 'waitlisted';
              console.log(`[Conflict Resolution] Existing appointment ${conflict.id} won. Incoming appointment ${event.entity_id} waitlisted.`);
           }
        }

        db.prepare(`
          INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, status, reason, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          event.entity_id, payload.patientId, payload.doctorId, payload.appointmentDate, 
          payload.appointmentTime, finalStatus, payload.reason || '', event.created_at || new Date().toISOString()
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
        db.prepare(`DELETE FROM appointments WHERE id=?`).run(event.entity_id);
        break;
      
      default:
        console.warn(`[EventStoreService] Unknown event_type: ${event.event_type}`);
    }
  }
}

// Export as a singleton
module.exports = new EventStoreService();
