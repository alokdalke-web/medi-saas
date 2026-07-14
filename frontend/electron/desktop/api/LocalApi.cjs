const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dbService = require('../database/DatabaseService.cjs');
const eventStoreService = require('../services/EventStoreService.cjs');
const { parseTimeToMinutes, checkTimeOverlap } = require('../utils/timeUtils.cjs');

const LOCAL_SECRET = 'temporary-offline-secret'; // Phase 1: Local JWT secret
// Phase 10: RBAC Permissions Map
const ROLE_PERMISSIONS = {
  'clinic_admin': ['/clinics', '/auth', '/health', '/sync', '/dashboard', '/patients', '/doctors', '/appointments', '/users', '/network', '/billing'],
  'receptionist': ['/auth', '/health', '/sync', '/dashboard', '/patients', '/doctors', '/appointments', '/network', '/medical-records', '/billing'],
  'doctor': ['/auth', '/health', '/sync', '/dashboard', '/patients', '/doctors', '/appointments', '/network', '/medical-records'],
  'patient': ['/auth', '/health', '/sync', '/dashboard', '/appointments', '/network', '/medical-records'],
  'billing': ['/auth', '/health', '/sync', '/dashboard', '/network', '/billing']
};

console.log('[LocalApi] Initialized.');

/**
 * Phase 10: Verify the user's role against the permissions map
 */
function verifyTokenAndRole(token, endpoint, method) {
  if (!token) throw new Error('401 Unauthorized: Missing token');
  let decoded;
  try {
    decoded = jwt.verify(token, LOCAL_SECRET);
  } catch (err) {
    throw new Error('401 Unauthorized: Invalid token');
  }
  const role = decoded.role;

  // Normalize endpoint (e.g., '/clinics/123' -> '/clinics', or '/patients?search=foo' -> '/patients')
  const pathOnly = endpoint.split('?')[0];
  const baseEndpoint = '/' + pathOnly.split('/')[1];

  const allowed = ROLE_PERMISSIONS[role] || [];
  if (!allowed.includes(baseEndpoint) && endpoint !== '/users/me') {
    throw new Error(`403 Forbidden: Role '${role}' is not authorized to access ${baseEndpoint}`);
  }

  return role;
}
function resolveDoctorId(db, userId) {
  if (!userId) return null;
  let doc = db.prepare('SELECT id FROM doctors WHERE user_id = ? AND is_deleted = 0').get(userId);
  if (doc) return doc.id;
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId);
  if (user && user.email) {
    doc = db.prepare('SELECT id FROM doctors WHERE email = ? AND is_deleted = 0').get(user.email);
    if (doc) return doc.id;
  }
  return null;
}

function resolvePatientId(db, userId) {
  if (!userId) return null;
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId);
  if (user && user.email) {
    const pat = db.prepare('SELECT id FROM patients WHERE email = ? AND is_deleted = 0').get(user.email);
    if (pat) return pat.id;
  }
  return null;
}

/**
 * Main router for all IPC requests from the frontend
 */
async function handleRequest(endpoint, options = {}) {
  console.log(`[LocalApi] Handling request: ${options.method || 'GET'} ${endpoint}`);

  try {
    const db = dbService.getDb();
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : {};

    // Phase 10: Enforce RBAC Security
    const token = options.headers?.Authorization?.replace('Bearer ', '');
    let authRole = null;
    let authUserId = null;
    if (endpoint !== '/auth/login') {
      authRole = verifyTokenAndRole(token, endpoint, method);
      if (token) {
        try {
          const decoded = jwt.verify(token, LOCAL_SECRET);
          authUserId = decoded.id;
        } catch (e) { }
      }
    }

    const getVersion = (id, explicitVersion) => {
      if (typeof explicitVersion === 'number') return explicitVersion;
      return db.prepare('SELECT MAX(version) as v FROM events WHERE entity_id = ?').get(id)?.v || 0;
    };

    // Basic routing logic

    if (endpoint === '/auth/me' && method === 'GET') {
      const activeRole = verifyTokenAndRole(token, '/auth', method);
      const decoded = jwt.verify(token, LOCAL_SECRET);

      const realUser = db.prepare('SELECT name, email, phone, profile_picture FROM users WHERE id = ? AND is_deleted = 0').get(decoded.id);

      return {
        id: decoded.id,
        name: realUser ? realUser.name : 'Local User',
        email: realUser ? realUser.email : '',
        phone: realUser ? realUser.phone : '',
        profile_picture: realUser ? realUser.profile_picture : '',
        role: activeRole,
        clinic_id: 'default_clinic_id'
      };
    }

    if (endpoint === '/auth/login' && method === 'POST') {
      const email = body.email || '';
      const password = body.password || '';

      // 1. Try to find real user in DB
      const realUser = db.prepare('SELECT id, name, role, password FROM users WHERE email = ? AND is_deleted = 0').get(email);
      if (realUser) {
        if (!realUser.password) throw new Error('401 Unauthorized: Invalid credentials');
        const isValid = bcrypt.compareSync(password, realUser.password);
        if (!isValid) throw new Error('401 Unauthorized: Invalid credentials');

        const authToken = jwt.sign({ id: realUser.id, role: realUser.role }, LOCAL_SECRET, { expiresIn: '24h' });
        return {
          token: authToken, // Keep using role as token for the mock RBAC engine
          user: { id: realUser.id, name: realUser.name, role: realUser.role }
        };
      }

      // 2. Fallback to testing mock logic
      let mockRole = 'clinic_admin';
      if (email.includes('receptionist')) mockRole = 'receptionist';
      if (email.includes('doctor')) mockRole = 'doctor';
      if (email.includes('patient')) mockRole = 'patient';
      if (email.includes('billing')) mockRole = 'billing';

      const authToken = jwt.sign({ id: 'local_user_1', role: mockRole }, LOCAL_SECRET, { expiresIn: '24h' });
      return {
        token: authToken,
        user: { id: 'local_user_1', name: `Local ${mockRole.split('_')[0]}`, role: mockRole }
      };
    }

    // 2. Clinics CRUD
    if (endpoint === '/network/nodes') {
      if (method === 'GET') {
        const discoveryService = require('../discovery/DiscoveryService.cjs');
        const nodes = discoveryService.getDiscoveredPeers();
        return { data: { nodes } };
      }
    }

    if (endpoint === '/network/cloud-url') {
      const nodeIdentityService = require('../services/NodeIdentityService.cjs');
      if (method === 'GET') {
        return { data: { cloudUrl: nodeIdentityService.getCloudUrl() } };
      }
      if (method === 'POST') {
        nodeIdentityService.setCloudUrl(body.cloudUrl);

        // Restart CloudSyncService to pick up new URL
        const cloudSyncService = require('../services/CloudSyncService.cjs');
        cloudSyncService.stop();
        cloudSyncService.start();

        return { success: true };
      }
    }

    if (endpoint === '/clinics' && method === 'GET') {
      const clinics = db.prepare('SELECT * FROM clinics').all();
      return clinics;
    }

    if (endpoint === '/clinics' && method === 'POST') {
      const id = crypto.randomUUID();
      const userId = 'local_admin_1'; // Phase 9: In real app, extract from auth headers

      // Phase 2, 8 & 9: Create a business event with version 0 and an explicit user!
      eventStoreService.saveEvent('ClinicCreated', 'clinics', id, {
        name: body.name,
        email: body.email,
        phone: body.phone
      }, 0, userId);

      return { success: true, id };
    }

    // Phase 8: Clinic Update to test OCC
    if (endpoint.startsWith('/clinics/') && method === 'PUT') {
      const id = endpoint.split('/')[2];
      const expectedVersion = body.expectedVersion || 0;
      const userId = 'local_admin_1';

      // If they didn't send expectedVersion, we bypass strict OCC check by just passing 0 or whatever.
      // But actually eventStoreService expects it to match.
      // Let's fetch the current version to bypass OCC if expectedVersion is missing,
      // since the simple settings page doesn't support OCC yet.
      const currentVerRecord = db.prepare('SELECT MAX(version) as maxVer FROM events WHERE entity_id = ?').get(id);
      const actualVersion = typeof body.expectedVersion === 'number' ? body.expectedVersion : (currentVerRecord?.maxVer || 0);

      eventStoreService.saveEvent('ClinicUpdated', 'clinics', id, {
        name: body.name,
        email: body.email,
        phone: body.phone,
        logo: body.logo,
        address: body.address
      }, actualVersion, userId);

      return { success: true, id, data: { clinic: body } };
    }

    // ---------------------------------------------------------
    // Phase 13: Extended CRUD Operations (Patients, Doctors, Users, Appointments)
    // ---------------------------------------------------------

    // Patients
    if (endpoint === '/patients' || endpoint.startsWith('/patients?')) {
      if (method === 'GET') {
        const search = new URL(endpoint, 'http://localhost').searchParams.get('search') || '';
        let query = `
          SELECT p.*, u.profile_picture 
          FROM patients p
          LEFT JOIN users u ON p.email = u.email
          WHERE p.is_deleted = 0
        `;
        let params = [];
        if (search) {
          query += ' AND (p.first_name LIKE ? OR p.last_name LIKE ? OR p.phone LIKE ? OR p.patient_code LIKE ?)';
          const like = `%${search}%`;
          params = [like, like, like, like];
        }
        const rows = db.prepare(query).all(...params);
        const patients = rows.map(r => ({
          _id: r.id, patientId: r.patient_code, firstName: r.first_name, lastName: r.last_name,
          gender: r.gender, dateOfBirth: r.date_of_birth, phone: r.phone, email: r.email,
          profile_picture: r.profile_picture || '',
          bloodGroup: r.blood_group, address: {
            street: r.address_street, city: r.address_city, state: r.address_state, country: r.address_country, pincode: r.address_pincode
          }, emergencyContact: { name: r.emergency_name, phone: r.emergency_phone, relation: r.emergency_rel }
        }));
        return { data: { patients } };
      }
      if (method === 'POST') {
        const id = crypto.randomUUID();
        eventStoreService.saveEvent('PatientCreated', 'patients', id, body, 0, token || 'local_admin_1');

        // Auto-create a User account so the patient can log in
        if (body.email) {
          const userId = crypto.randomUUID();
          const hashedPassword = bcrypt.hashSync('password123', 10); // Default password
          eventStoreService.saveEvent('UserCreated', 'users', userId, {
            name: `${body.firstName} ${body.lastName}`,
            email: body.email,
            phone: body.phone || '',
            role: 'patient',
            password: hashedPassword,
            isActive: true
          }, 0, token || 'local_admin_1');
        }

        return { data: { patient: { _id: id, ...body } } };
      }
    }
    if (endpoint.startsWith('/patients/') && method === 'PUT') {
      const id = endpoint.split('/')[2];
      const existing = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);
      if (!existing) throw new Error('Patient not found');

      const updatedBody = {
        ...body,
        firstName: body.firstName !== undefined ? body.firstName : existing.first_name,
        lastName: body.lastName !== undefined ? body.lastName : existing.last_name,
        gender: body.gender !== undefined ? body.gender : existing.gender,
        dateOfBirth: body.dateOfBirth !== undefined ? body.dateOfBirth : existing.date_of_birth,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        email: body.email !== undefined ? body.email : existing.email,
        bloodGroup: body.bloodGroup !== undefined ? body.bloodGroup : existing.blood_group,
        address: body.address || {
          street: existing.address_street,
          city: existing.address_city,
          state: existing.address_state,
          country: existing.address_country,
          pincode: existing.address_pincode
        },
        emergencyContact: body.emergencyContact || {
          name: existing.emergency_name,
          phone: existing.emergency_phone,
          relation: existing.emergency_rel
        }
      };

      eventStoreService.saveEvent('PatientUpdated', 'patients', id, updatedBody, getVersion(id, body.expectedVersion), token || 'local_admin_1');
      return { data: { patient: { _id: id, ...updatedBody } } };
    }
    if (endpoint.startsWith('/patients/') && method === 'DELETE') {
      const id = endpoint.split('/')[2];
      eventStoreService.saveEvent('PatientDeleted', 'patients', id, { isDeleted: true }, getVersion(id), token || 'local_admin_1');
      return { success: true };
    }

    // Doctors
    if (endpoint === '/doctors') {
      if (method === 'GET') {
        const rows = db.prepare(`
          SELECT d.*, u.profile_picture 
          FROM doctors d
          LEFT JOIN users u ON d.user_id = u.id OR d.email = u.email
          WHERE d.is_deleted = 0
        `).all();
        const doctors = rows.map(r => ({
          _id: r.id, doctorCode: r.doctor_code, name: r.name, email: r.email, phone: r.phone,
          specialization: r.specialization, qualification: r.qualification, experience: r.experience,
          isActive: r.is_active === 1,
          profile_picture: r.profile_picture || ''
        }));
        return { data: { doctors } };
      }
      if (method === 'POST') {
        const userId = crypto.randomUUID();
        const hashedPassword = body.password ? bcrypt.hashSync(body.password, 10) : bcrypt.hashSync('temp_pass', 10);

        // Register the doctor as a user (staff member)
        eventStoreService.saveEvent('UserCreated', 'users', userId, {
          name: body.name,
          email: body.email,
          phone: body.phone,
          role: 'doctor',
          password: hashedPassword,
          isActive: true
        }, 0, token || 'local_admin_1');

        const doctorId = crypto.randomUUID();
        eventStoreService.saveEvent('DoctorCreated', 'doctors', doctorId, { ...body, userId }, 0, token || 'local_admin_1');

        return { data: { doctor: { _id: doctorId, ...body, userId } } };
      }
    }
    if (endpoint.startsWith('/doctors/') && method === 'PUT') {
      const id = endpoint.split('/')[2];
      const existing = db.prepare('SELECT * FROM doctors WHERE id = ?').get(id);
      if (!existing) throw new Error('Doctor not found');

      const updatedBody = {
        ...body,
        name: body.name !== undefined ? body.name : existing.name,
        email: body.email !== undefined ? body.email : existing.email,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        specialization: body.specialization !== undefined ? body.specialization : existing.specialization,
        qualification: body.qualification !== undefined ? body.qualification : existing.qualification,
        experience: body.experience !== undefined ? body.experience : existing.experience,
        isActive: body.isActive !== undefined ? body.isActive : (existing.is_active === 1)
      };

      eventStoreService.saveEvent('DoctorUpdated', 'doctors', id, updatedBody, getVersion(id, body.expectedVersion), token || 'local_admin_1');

      if (existing.user_id && (body.name || body.phone || body.isActive !== undefined)) {
        const userUpdateBody = {};
        if (body.name) userUpdateBody.name = body.name;
        if (body.phone) userUpdateBody.phone = body.phone;
        if (body.isActive !== undefined) userUpdateBody.isActive = body.isActive;
        eventStoreService.saveEvent('UserUpdated', 'users', existing.user_id, userUpdateBody, getVersion(existing.user_id), token || 'local_admin_1');
      }

      return { data: { doctor: { _id: id, ...updatedBody } } };
    }
    if (endpoint.startsWith('/doctors/') && method === 'DELETE') {
      const id = endpoint.split('/')[2];
      const existing = db.prepare('SELECT user_id FROM doctors WHERE id = ?').get(id);

      eventStoreService.saveEvent('DoctorDeleted', 'doctors', id, { isDeleted: true }, getVersion(id), token || 'local_admin_1');

      if (existing && existing.user_id) {
        eventStoreService.saveEvent('UserDeleted', 'users', existing.user_id, { isDeleted: true }, getVersion(existing.user_id), token || 'local_admin_1');
      }

      return { success: true };
    }

    // Users
    if (endpoint === '/users') {
      if (method === 'GET') {
        const rows = db.prepare('SELECT * FROM users WHERE is_deleted = 0').all();
        const users = rows.map(r => ({
          _id: r.id, name: r.name, email: r.email, phone: r.phone, role: r.role, isActive: r.is_active === 1
        }));
        return { data: { users } };
      }
      if (method === 'POST') {
        const id = crypto.randomUUID();
        const hashedPassword = body.password ? bcrypt.hashSync(body.password, 10) : bcrypt.hashSync('temp_pass', 10);
        const payloadBody = { ...body, password: hashedPassword };
        eventStoreService.saveEvent('UserCreated', 'users', id, payloadBody, 0, token || 'local_admin_1');
        return { data: { user: { _id: id, ...body, password: undefined } } };
      }
    }
    if (endpoint === '/users/me' && method === 'PUT') {
      const userId = authUserId;
      if (!userId) throw new Error('401 Unauthorized');

      const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (!existing) {
        // Handle mock users by returning a simulated success
        return {
          data: {
            user: {
              _id: userId,
              name: body.name || 'Local User',
              email: 'mock@example.com',
              phone: body.phone || '',
              profile_picture: body.profile_picture || ''
            }
          }
        };
      }

      const payloadBody = { ...body };

      const updatedBody = {
        name: payloadBody.name !== undefined ? payloadBody.name : existing.name,
        email: existing.email, // email change not supported in this basic profile edit
        phone: payloadBody.phone !== undefined ? payloadBody.phone : existing.phone,
        role: existing.role,
        isActive: existing.is_active === 1,
        profile_picture: payloadBody.profile_picture !== undefined ? payloadBody.profile_picture : existing.profile_picture
      };

      if (payloadBody.password) {
        updatedBody.password = bcrypt.hashSync(payloadBody.password, 10);
      }

      eventStoreService.saveEvent('UserUpdated', 'users', userId, updatedBody, getVersion(userId), token || 'local_admin_1');

      // Sync changes to doctors or patients table
      if (existing.role === 'doctor') {
        const docId = resolveDoctorId(db, userId);
        if (docId) {
          const existingDoc = db.prepare('SELECT * FROM doctors WHERE id = ?').get(docId);
          if (existingDoc) {
            const docUpdate = {
              name: payloadBody.name !== undefined ? payloadBody.name : existingDoc.name,
              email: existingDoc.email,
              phone: payloadBody.phone !== undefined ? payloadBody.phone : existingDoc.phone,
              specialization: existingDoc.specialization,
              qualification: existingDoc.qualification,
              experience: existingDoc.experience,
              isActive: existingDoc.is_active === 1
            };
            eventStoreService.saveEvent('DoctorUpdated', 'doctors', docId, docUpdate, getVersion(docId), token || 'local_admin_1');
          }
        }
      } else if (existing.role === 'patient') {
        const patId = resolvePatientId(db, userId);
        if (patId) {
          const existingPat = db.prepare('SELECT * FROM patients WHERE id = ?').get(patId);
          if (existingPat) {
            let newFirstName = existingPat.first_name;
            let newLastName = existingPat.last_name;
            if (payloadBody.name !== undefined) {
              const parts = payloadBody.name.split(' ');
              newFirstName = parts[0];
              newLastName = parts.slice(1).join(' ') || '';
            }

            const patUpdate = {
              firstName: newFirstName,
              lastName: newLastName,
              gender: existingPat.gender,
              dateOfBirth: existingPat.date_of_birth,
              phone: payloadBody.phone !== undefined ? payloadBody.phone : existingPat.phone,
              email: existingPat.email,
              bloodGroup: existingPat.blood_group,
              address: {
                street: existingPat.address_street,
                city: existingPat.address_city,
                state: existingPat.address_state,
                country: existingPat.address_country,
                pincode: existingPat.address_pincode
              },
              emergencyContact: {
                name: existingPat.emergency_name,
                phone: existingPat.emergency_phone,
                relation: existingPat.emergency_rel
              }
            };
            eventStoreService.saveEvent('PatientUpdated', 'patients', patId, patUpdate, getVersion(patId), token || 'local_admin_1');
          }
        }
      }
      return { data: { user: { _id: userId, ...updatedBody } } };
    }

    if (endpoint.startsWith('/users/') && method === 'PUT') {
      const id = endpoint.split('/')[2];
      const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
      if (!existing) throw new Error('User not found');

      const payloadBody = { ...body };
      if (payloadBody.password) {
        payloadBody.password = bcrypt.hashSync(payloadBody.password, 10);
      }

      const updatedBody = {
        ...payloadBody,
        name: payloadBody.name !== undefined ? payloadBody.name : existing.name,
        email: payloadBody.email !== undefined ? payloadBody.email : existing.email,
        phone: payloadBody.phone !== undefined ? payloadBody.phone : existing.phone,
        role: payloadBody.role !== undefined ? payloadBody.role : existing.role,
        isActive: payloadBody.isActive !== undefined ? payloadBody.isActive : (existing.is_active === 1)
      };

      eventStoreService.saveEvent('UserUpdated', 'users', id, updatedBody, getVersion(id, body.expectedVersion), token || 'local_admin_1');
      return { data: { user: { _id: id, ...updatedBody } } };
    }
    if (endpoint.startsWith('/users/') && method === 'DELETE') {
      const id = endpoint.split('/')[2];
      eventStoreService.saveEvent('UserDeleted', 'users', id, { isDeleted: true }, getVersion(id), token || 'local_admin_1');
      return { success: true };
    }

    // Appointments
    if (endpoint === '/appointments' || endpoint.startsWith('/appointments?')) {
      if (method === 'GET') {
        const date = new URL(endpoint, 'http://localhost').searchParams.get('date');
        let query = `
            SELECT a.*, 
                   p.first_name as p_firstName, p.last_name as p_lastName, p.patient_code as p_patientId,
                   d.name as d_name, d.specialization as d_specialization,
                   up.profile_picture as patient_profile_picture,
                   ud.profile_picture as doctor_profile_picture
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN users up ON p.email = up.email
            LEFT JOIN users ud ON (d.user_id = ud.id OR d.email = ud.email)
            WHERE a.is_deleted = 0 AND a.status != 'cancelled'
          `;
        let params = [];

        if (authRole === 'patient') {
          const pId = resolvePatientId(db, authUserId);
          query += " AND a.patient_id = ?";
          params.push(pId);
        } else if (authRole === 'doctor') {
          const dId = resolveDoctorId(db, authUserId);
          query += " AND a.doctor_id = ?";
          params.push(dId);
        }

        if (date) {
          query += " AND DATE(a.appointment_date) = ?";
          params.push(date.split('T')[0]);
        }
        const rows = db.prepare(query).all(...params);
        const appointments = rows.map(r => ({
          _id: r.id, appointmentDate: r.appointment_date, appointmentTime: r.appointment_time, status: r.status,
          patientId: { _id: r.patient_id, firstName: r.p_firstName, lastName: r.p_lastName, patientId: r.p_patientId, profile_picture: r.patient_profile_picture || '' },
          doctorId: { _id: r.doctor_id, name: r.d_name, specialization: r.d_specialization, profile_picture: r.doctor_profile_picture || '' }
        }));
        return { data: { appointments } };
      }
      if (method === 'POST') {
        const existingDayAppts = db.prepare(`
            SELECT appointment_time FROM appointments 
            WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'
          `).all(body.doctorId, body.appointmentDate);

        const hasConflict = existingDayAppts.some(appt =>
          checkTimeOverlap(body.appointmentTime, appt.appointment_time, 30, 30)
        );

        if (hasConflict) {
          throw new Error('This time slot is already booked for the selected doctor.');
        }

        const id = crypto.randomUUID();
        eventStoreService.saveEvent('AppointmentCreated', 'appointments', id, body, 0, token || 'local_admin_1');
        return { data: { appointment: { _id: id, ...body } } };
      }
    }
    if (endpoint.startsWith('/appointments/') && method === 'PUT') {
      const id = endpoint.split('/')[2];

      // Fetch existing to support partial updates
      const existingAppt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
      if (!existingAppt) throw new Error('Appointment not found');

      const updatedBody = {
        ...body,
        status: body.status !== undefined ? body.status : existingAppt.status,
        reason: body.reason !== undefined ? body.reason : existingAppt.reason,
        appointmentDate: body.appointmentDate !== undefined ? body.appointmentDate : existingAppt.appointment_date,
        appointmentTime: body.appointmentTime !== undefined ? body.appointmentTime : existingAppt.appointment_time,
        doctorId: body.doctorId !== undefined ? body.doctorId : existingAppt.doctor_id,
        patientId: body.patientId !== undefined ? body.patientId : existingAppt.patient_id
      };

      if (updatedBody.appointmentDate && updatedBody.appointmentTime) {
        const existingDayAppts = db.prepare(`
             SELECT id, appointment_time FROM appointments 
             WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled' AND id != ?
           `).all(updatedBody.doctorId, updatedBody.appointmentDate, id);

        const hasConflict = existingDayAppts.some(appt =>
          checkTimeOverlap(updatedBody.appointmentTime, appt.appointment_time, 30, 30)
        );

        if (hasConflict) {
          throw new Error('This time slot is already booked for the selected doctor.');
        }
      }

      eventStoreService.saveEvent('AppointmentUpdated', 'appointments', id, updatedBody, getVersion(id, body.expectedVersion), token || 'local_admin_1');
      return { data: { appointment: { _id: id, ...updatedBody } } };
    }
    if (endpoint.startsWith('/appointments/') && method === 'DELETE') {
      const id = endpoint.split('/')[2];
      eventStoreService.saveEvent('AppointmentDeleted', 'appointments', id, { isDeleted: true }, getVersion(id), token || 'local_admin_1');
      return { success: true };
    }

    // Medical Records (Quick Actions)
    if (endpoint === '/medical-records' || endpoint.startsWith('/medical-records?')) {
      if (method === 'GET') {
        let patientId = new URL(endpoint, 'http://localhost').searchParams.get('patientId');
        if (authRole === 'patient') {
          patientId = resolvePatientId(db, authUserId);
        }
        let query = 'SELECT * FROM medical_records WHERE is_deleted = 0';
        let params = [];
        if (patientId) {
          query += ' AND patient_id = ?';
          params.push(patientId);
        }
        const rows = db.prepare(query).all(...params);
        const records = rows.map(r => ({
          _id: r.id, patientId: r.patient_id, doctorId: r.doctor_id,
          recordType: r.record_type, content: JSON.parse(r.content),
          createdAt: r.created_at
        }));
        return { data: { records } };
      }
      if (method === 'POST') {
        const id = crypto.randomUUID();

        // Map to database column names for local SQLite insertion if needed, or rely on Sync.
        // The event payload goes as-is into the events table.
        eventStoreService.saveEvent('MedicalRecordCreated', 'medical_records', id, body, 0, token || 'local_admin_1');

        return { data: { record: { _id: id, ...body, createdAt: new Date().toISOString() } } };
      }
    }

    // Billing
    if (endpoint === '/billing' || endpoint.startsWith('/billing?')) {
      if (method === 'GET') {
        const patientId = new URL(endpoint, 'http://localhost').searchParams.get('patientId');
        let query = `
          SELECT b.*, 
                 p.first_name as p_firstName, p.last_name as p_lastName, p.patient_code as p_patientId, p.phone as p_phone,
                 a.appointment_date, a.appointment_time
          FROM billing b
          LEFT JOIN patients p ON b.patient_id = p.id
          LEFT JOIN appointments a ON b.appointment_id = a.id
          WHERE b.is_deleted = 0
        `;
        let params = [];
        if (patientId) {
          query += ' AND b.patient_id = ?';
          params.push(patientId);
        }

        const rows = db.prepare(query).all(...params);
        const billings = rows.map(r => ({
          _id: r.id,
          billingId: r.billing_id,
          clinicId: r.clinic_id,
          patientId: { _id: r.patient_id, firstName: r.p_firstName, lastName: r.p_lastName, patientId: r.p_patientId, phone: r.p_phone },
          appointmentId: r.appointment_id ? { _id: r.appointment_id, appointmentDate: r.appointment_date, appointmentTime: r.appointment_time } : null,
          amount: r.amount,
          status: r.status,
          paymentMethod: r.payment_method,
          issuedDate: r.issued_date,
          dueDate: r.due_date,
          notes: r.notes,
          createdAt: r.created_at
        }));

        return { data: { billings } };
      }
      if (method === 'POST') {
        const id = crypto.randomUUID();
        eventStoreService.saveEvent('BillingCreated', 'billing', id, body, 0, token || 'local_admin_1');
        return { data: { billing: { _id: id, ...body, createdAt: new Date().toISOString() } } };
      }
    }
    if (endpoint.startsWith('/billing/') && method === 'PUT') {
      const id = endpoint.split('/')[2];
      const existing = db.prepare('SELECT * FROM billing WHERE id = ?').get(id);
      if (!existing) throw new Error('Invoice not found');

      const updatedBody = {
        ...body,
        amount: body.amount !== undefined ? body.amount : existing.amount,
        status: body.status !== undefined ? body.status : existing.status,
        paymentMethod: body.paymentMethod !== undefined ? body.paymentMethod : existing.payment_method,
        notes: body.notes !== undefined ? body.notes : existing.notes
      };

      eventStoreService.saveEvent('BillingUpdated', 'billing', id, updatedBody, getVersion(id), token || 'local_admin_1');
      return { data: { billing: { _id: id, ...updatedBody } } };
    }
    if (endpoint.startsWith('/billing/') && method === 'DELETE') {
      const id = endpoint.split('/')[2];
      eventStoreService.saveEvent('BillingDeleted', 'billing', id, { isDeleted: true }, getVersion(id), token || 'local_admin_1');
      return { success: true };
    }

    if (endpoint === '/clinics/my-clinic') {
      const clinic = db.prepare('SELECT * FROM clinics LIMIT 1').get();
      if (!clinic) {
        return { data: { clinic: { id: 'my-clinic', name: 'Offline Clinic', phone: '123-456' } } };
      }
      return {
        data: {
          clinic: {
            id: clinic.id,
            name: clinic.name,
            email: clinic.email,
            phone: clinic.phone,
            logo: clinic.logo,
            address: {
              street: clinic.address_street,
              city: clinic.address_city,
              state: clinic.address_state,
              country: clinic.address_country,
              pincode: clinic.address_pincode
            }
          }
        }
      };
    }

    // 3. Health check
    if (endpoint === '/health' && method === 'GET') {
      return { status: 'online', mode: 'offline-p2p' };
    }

    // 4. Sync polling stub (Phase 4 compatibility)
    if (endpoint === '/sync/pending' && method === 'GET') {
      return []; // Return empty array so frontend sync queue doesn't crash
    }

    // 5. Dashboard Real Data
    if (endpoint === '/dashboard' && method === 'GET') {
      const role = authRole;
      const userId = authUserId; // 'local_user_1' or real id

      const todayStr = new Date().toISOString().split('T')[0];

      if (role === 'patient') {
        // Patient specific dashboard: upcoming and past appointments
        const patientIdForQuery = resolvePatientId(db, userId);

        const myUpcomingApts = patientIdForQuery ? db.prepare(`
            SELECT a.id as _id, a.appointment_date as appointmentDate, a.appointment_time as appointmentTime, a.status,
                   d.name as doctor_name, d.specialization as doctor_specialization
            FROM appointments a
            LEFT JOIN doctors d ON a.doctor_id = d.id
            WHERE a.patient_id = ? AND a.appointment_date >= ? AND a.status IN ('scheduled', 'checked_in', 'waitlisted') AND a.is_deleted = 0
            ORDER BY a.appointment_date ASC, a.appointment_time ASC LIMIT 5
          `).all(patientIdForQuery, todayStr) : [];

        const myPastApts = patientIdForQuery ? db.prepare(`
            SELECT a.id as _id, a.appointment_date as appointmentDate, a.appointment_time as appointmentTime, a.status,
                   d.name as doctor_name, d.specialization as doctor_specialization
            FROM appointments a
            LEFT JOIN doctors d ON a.doctor_id = d.id
            WHERE a.patient_id = ? AND (a.appointment_date < ? OR a.status = 'completed') AND a.is_deleted = 0
            ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT 5
          `).all(patientIdForQuery, todayStr) : [];

        return {
          success: true,
          data: {
            upcomingAppointments: myUpcomingApts.map(a => ({
              _id: a._id,
              appointmentDate: a.appointmentDate,
              appointmentTime: a.appointmentTime,
              status: a.status,
              doctorId: { name: a.doctor_name, specialization: a.doctor_specialization }
            })),
            pastAppointments: myPastApts.map(a => ({
              _id: a._id,
              appointmentDate: a.appointmentDate,
              appointmentTime: a.appointmentTime,
              status: a.status,
              doctorId: { name: a.doctor_name, specialization: a.doctor_specialization }
            }))
          }
        };
      }

      if (role === 'doctor') {
        // Doctor specific dashboard
        const doctorIdForQuery = resolveDoctorId(db, userId);

        const todaysApts = doctorIdForQuery ? db.prepare(`
            SELECT a.id as _id, a.appointment_date as appointmentDate, a.appointment_time as appointmentTime, a.status,
                   p.first_name, p.last_name, p.gender, p.phone
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            WHERE a.doctor_id = ? AND a.appointment_date = ? AND a.is_deleted = 0
            ORDER BY a.appointment_time ASC
          `).all(doctorIdForQuery, todayStr) : [];

        const upcomingApts = doctorIdForQuery ? db.prepare(`
            SELECT a.id as _id, a.appointment_date as appointmentDate, a.appointment_time as appointmentTime, a.status,
                   p.first_name, p.last_name, p.gender, p.phone
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            WHERE a.doctor_id = ? AND a.appointment_date >= ? AND a.status IN ('scheduled', 'checked_in', 'waitlisted') AND a.is_deleted = 0
            ORDER BY a.appointment_date ASC, a.appointment_time ASC LIMIT 10
          `).all(doctorIdForQuery, todayStr) : [];

        const appointmentHistoryRows = doctorIdForQuery ? db.prepare(`
            SELECT a.id as _id, a.appointment_date as appointmentDate, a.appointment_time as appointmentTime, a.status, a.reason,
                   p.first_name, p.last_name, p.patient_code as patientId
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            WHERE a.doctor_id = ? AND a.is_deleted = 0
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
          `).all(doctorIdForQuery) : [];

        return {
          success: true,
          data: {
            todaysAppointments: todaysApts.length,
            totalPatientsTreated: 15, // Stubbed for now
            upcomingAppointments: upcomingApts.map(a => ({
              _id: a._id,
              appointmentDate: a.appointmentDate,
              appointmentTime: a.appointmentTime,
              status: a.status,
              patientId: { firstName: a.first_name, lastName: a.last_name, gender: a.gender, phone: a.phone }
            })),
            appointmentHistory: appointmentHistoryRows.map(a => ({
              _id: a._id,
              appointmentDate: a.appointmentDate,
              appointmentTime: a.appointmentTime,
              status: a.status,
              reason: a.reason,
              patientId: { firstName: a.first_name, lastName: a.last_name, patientId: a.patientId }
            }))
          }
        };
      }

      // Default clinic_admin and receptionist view
      const totalPatients = db.prepare('SELECT COUNT(*) as c FROM patients WHERE is_deleted = 0').get().c;
      const totalDoctors = db.prepare('SELECT COUNT(*) as c FROM doctors WHERE is_deleted = 0').get().c;
      const totalAppointments = db.prepare("SELECT COUNT(*) as c FROM appointments WHERE status != 'cancelled' AND is_deleted = 0").get().c;

      const todaysAppointments = db.prepare("SELECT COUNT(*) as c FROM appointments WHERE appointment_date = ? AND status != 'cancelled' AND is_deleted = 0").get(todayStr).c;

      const recentApts = db.prepare(`
          SELECT a.id as _id, a.appointment_date as appointmentDate, a.appointment_time as appointmentTime, a.status, a.created_at,
                 p.first_name, p.last_name, d.name as doctor_name
          FROM appointments a
          LEFT JOIN patients p ON a.patient_id = p.id
          LEFT JOIN doctors d ON a.doctor_id = d.id
          WHERE a.is_deleted = 0
          ORDER BY a.created_at DESC LIMIT 5
        `).all();

      const mappedRecent = recentApts.map(a => ({
        _id: a._id,
        appointmentDate: a.appointmentDate,
        appointmentTime: a.appointmentTime,
        status: a.status,
        patientId: { firstName: a.first_name, lastName: a.last_name },
        doctorId: { name: a.doctor_name }
      }));

      const recentPats = db.prepare(`
          SELECT id as _id, first_name, last_name, created_at
          FROM patients
          WHERE is_deleted = 0
          ORDER BY created_at DESC LIMIT 5
        `).all();

      const activities = [
        ...recentApts.map(a => ({
          id: a._id + '_apt',
          type: 'appointment',
          title: a.status === 'scheduled' ? 'New Appointment Scheduled' : `Appointment ${a.status}`,
          description: `Appointment for ${a.first_name || 'Unknown'} ${a.last_name || ''} with Dr. ${a.doctor_name || 'Unknown'}.`,
          timestamp: a.created_at,
          icon: a.status === 'cancelled' ? 'event_busy' : 'event',
          colorClass: a.status === 'cancelled' ? 'bg-[#fee2e2]' : 'bg-[#dbeafe]',
          iconColor: a.status === 'cancelled' ? 'text-error' : 'text-secondary'
        })),
        ...recentPats.map(p => ({
          id: p._id + '_pat',
          type: 'patient',
          title: 'New Patient Registered',
          description: `${p.first_name || ''} ${p.last_name || ''} has been registered.`,
          timestamp: p.created_at,
          icon: 'person_add',
          colorClass: 'bg-[#dcfce7]',
          iconColor: 'text-primary'
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

      const upcomingApts = db.prepare(`
          SELECT a.id as _id, a.appointment_date as appointmentDate, a.appointment_time as appointmentTime, a.status,
                 p.first_name, p.last_name, d.name as doctor_name
          FROM appointments a
          LEFT JOIN patients p ON a.patient_id = p.id
          LEFT JOIN doctors d ON a.doctor_id = d.id
          WHERE a.appointment_date >= ? AND a.status IN ('scheduled', 'checked_in', 'waitlisted') AND a.is_deleted = 0
          ORDER BY a.appointment_date ASC, a.appointment_time ASC LIMIT 10
        `).all(todayStr);

      const mappedUpcoming = upcomingApts.map(a => ({
        _id: a._id,
        appointmentDate: a.appointmentDate,
        appointmentTime: a.appointmentTime,
        status: a.status,
        patientId: { firstName: a.first_name, lastName: a.last_name },
        doctorId: { name: a.doctor_name }
      }));

      return {
        success: true,
        data: {
          totalPatients,
          totalDoctors,
          totalAppointments,
          todaysAppointments,
          totalRevenue: 0,
          recentAppointments: mappedRecent,
          upcomingAppointments: mappedUpcoming,
          activities
        }
      };
    }


    console.warn(`[LocalApi] 404 Not Found: ${endpoint}`);
    throw new Error(`Endpoint not found locally: ${endpoint}`);

  } catch (error) {
    console.error(`[LocalApi] Error handling ${endpoint}:`, error);

    // Phase 8: Handle Optimistic Concurrency Control Conflicts
    if (error.message.includes('Conflict Detected')) {
      return { error: 'Conflict', status: 409, message: error.message };
    }

    // Handle Double Booking Validation
    if (error.message.includes('already booked')) {
      return { error: 'Conflict', status: 409, message: error.message };
    }

    // Phase 10: Handle RBAC Forbidden Errors
    if (error.message.includes('403 Forbidden')) {
      return { error: 'Forbidden', status: 403, message: error.message };
    }

    throw error; // Let the IPC bridge serialize the error back to React
  }
}

module.exports = {
  verifyTokenAndRole,
  handleRequest
};
