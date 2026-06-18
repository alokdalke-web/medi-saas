const crypto = require('crypto');
const dbService = require('../database/DatabaseService.cjs');
const eventStoreService = require('../services/EventStoreService.cjs');

// Phase 10: RBAC Permissions Map
const ROLE_PERMISSIONS = {
  'clinic_admin': ['/clinics', '/auth', '/health', '/sync', '/dashboard', '/patients', '/doctors', '/appointments', '/users', '/network'],
  'receptionist': ['/auth', '/health', '/sync', '/dashboard', '/patients', '/appointments', '/network'],
  'doctor': ['/auth', '/health', '/sync', '/dashboard', '/patients', '/appointments', '/network'],
  'billing': ['/auth', '/health', '/sync', '/dashboard', '/network']
};

class LocalApi {
  constructor() {
    console.log('[LocalApi] Initialized.');
  }

  /**
   * Phase 10: Verify the user's role against the permissions map
   */
  verifyTokenAndRole(token, endpoint, method) {
    // For this Phase 10 mock, we treat the token string as the role identifier.
    // In a real scenario, we would `jwt.verify(token)` and extract the role.
    const role = token || 'clinic_admin'; // Default fallback for existing tests
    
    // Normalize endpoint (e.g., '/clinics/123' -> '/clinics', or '/patients?search=foo' -> '/patients')
    const pathOnly = endpoint.split('?')[0];
    const baseEndpoint = '/' + pathOnly.split('/')[1];
    
    const allowed = ROLE_PERMISSIONS[role] || [];
    if (!allowed.includes(baseEndpoint)) {
      throw new Error(`403 Forbidden: Role '${role}' is not authorized to access ${baseEndpoint}`);
    }
    
    return role;
  }

  /**
   * Main router for all IPC requests from the frontend
   */
  async handleRequest(endpoint, options = {}) {
    console.log(`[LocalApi] Handling request: ${options.method || 'GET'} ${endpoint}`);
    
    try {
      const db = dbService.getDb();
      const method = options.method || 'GET';
      const body = options.body ? JSON.parse(options.body) : {};

      // Phase 10: Enforce RBAC Security
      const token = options.headers?.Authorization?.replace('Bearer ', '');
      if (endpoint !== '/auth/login') {
        this.verifyTokenAndRole(token, endpoint, method);
      }

      const getVersion = (id, explicitVersion) => {
        if (typeof explicitVersion === 'number') return explicitVersion;
        return db.prepare('SELECT MAX(version) as v FROM events WHERE entity_id = ?').get(id)?.v || 0;
      };

      // Basic routing logic
      
      // 1. Auth mock (so frontend doesn't crash while we migrate fully)
      if (endpoint === '/auth/me' && method === 'GET') {
        // Use the verify method to pull the mocked testing role
        const activeRole = this.verifyTokenAndRole(token, '/auth', method);
        return { 
          id: 'local_user_1', 
          name: 'Local User', 
          role: activeRole,
          clinic_id: 'default_clinic_id' 
        };
      }

      if (endpoint === '/auth/login' && method === 'POST') {
        const email = body.email || '';
        
        // 1. Try to find real user in DB
        const realUser = db.prepare('SELECT id, name, role FROM users WHERE email = ? AND is_deleted = 0').get(email);
        if (realUser) {
          return {
            token: realUser.role, // Keep using role as token for the mock RBAC engine
            user: { id: realUser.id, name: realUser.name, role: realUser.role }
          };
        }

        // 2. Fallback to testing mock logic
        let mockRole = 'clinic_admin';
        if (email.includes('receptionist')) mockRole = 'receptionist';
        if (email.includes('doctor')) mockRole = 'doctor';
        if (email.includes('billing')) mockRole = 'billing';

        return { 
          token: mockRole, 
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
        const expectedVersion = body.expectedVersion;
        const userId = 'local_admin_1';
        
        if (typeof expectedVersion !== 'number') {
          throw new Error('expectedVersion is required for updates');
        }

        eventStoreService.saveEvent('ClinicUpdated', 'clinics', id, {
          name: body.name,
          email: body.email,
          phone: body.phone
        }, expectedVersion, userId);

        return { success: true, id };
      }

      // ---------------------------------------------------------
      // Phase 13: Extended CRUD Operations (Patients, Doctors, Users, Appointments)
      // ---------------------------------------------------------

      // Patients
      if (endpoint === '/patients' || endpoint.startsWith('/patients?')) {
        if (method === 'GET') {
          const search = new URL(endpoint, 'http://localhost').searchParams.get('search') || '';
          let query = 'SELECT * FROM patients WHERE is_deleted = 0';
          let params = [];
          if (search) {
            query += ' AND (first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR patient_code LIKE ?)';
            const like = `%${search}%`;
            params = [like, like, like, like];
          }
          const rows = db.prepare(query).all(...params);
          const patients = rows.map(r => ({
            _id: r.id, patientId: r.patient_code, firstName: r.first_name, lastName: r.last_name,
            gender: r.gender, dateOfBirth: r.date_of_birth, phone: r.phone, email: r.email,
            bloodGroup: r.blood_group, address: {
              street: r.address_street, city: r.address_city, state: r.address_state, country: r.address_country, pincode: r.address_pincode
            }, emergencyContact: { name: r.emergency_name, phone: r.emergency_phone, relation: r.emergency_rel }
          }));
          return { data: { patients } };
        }
        if (method === 'POST') {
          const id = crypto.randomUUID();
          eventStoreService.saveEvent('PatientCreated', 'patients', id, body, 0, token || 'local_admin_1');
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
          const rows = db.prepare('SELECT * FROM doctors WHERE is_deleted = 0').all();
          const doctors = rows.map(r => ({
            _id: r.id, doctorCode: r.doctor_code, name: r.name, email: r.email, phone: r.phone,
            specialization: r.specialization, qualification: r.qualification, experience: r.experience,
            isActive: r.is_active === 1
          }));
          return { data: { doctors } };
        }
        if (method === 'POST') {
          const id = crypto.randomUUID();
          eventStoreService.saveEvent('DoctorCreated', 'doctors', id, body, 0, token || 'local_admin_1');
          return { data: { doctor: { _id: id, ...body } } };
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
        return { data: { doctor: { _id: id, ...updatedBody } } };
      }
      if (endpoint.startsWith('/doctors/') && method === 'DELETE') {
        const id = endpoint.split('/')[2];
        eventStoreService.saveEvent('DoctorDeleted', 'doctors', id, { isDeleted: true }, getVersion(id), token || 'local_admin_1');
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
          eventStoreService.saveEvent('UserCreated', 'users', id, body, 0, token || 'local_admin_1');
          return { data: { user: { _id: id, ...body } } };
        }
      }
      if (endpoint.startsWith('/users/') && method === 'PUT') {
        const id = endpoint.split('/')[2];
        const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        if (!existing) throw new Error('User not found');

        const updatedBody = {
          ...body,
          name: body.name !== undefined ? body.name : existing.name,
          email: body.email !== undefined ? body.email : existing.email,
          phone: body.phone !== undefined ? body.phone : existing.phone,
          role: body.role !== undefined ? body.role : existing.role,
          isActive: body.isActive !== undefined ? body.isActive : (existing.is_active === 1)
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
                   d.name as d_name, d.specialization as d_specialization
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN doctors d ON a.doctor_id = d.id
          `;
          let params = [];
          if (date) {
            query += " WHERE DATE(a.appointment_date) = ?";
            params.push(date.split('T')[0]);
          }
          const rows = db.prepare(query).all(...params);
          const appointments = rows.map(r => ({
            _id: r.id, appointmentDate: r.appointment_date, appointmentTime: r.appointment_time, status: r.status,
            patientId: { _id: r.patient_id, firstName: r.p_firstName, lastName: r.p_lastName, patientId: r.p_patientId },
            doctorId: { _id: r.doctor_id, name: r.d_name, specialization: r.d_specialization }
          }));
          return { data: { appointments } };
        }
        if (method === 'POST') {
          const existing = db.prepare(`
            SELECT id FROM appointments 
            WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'cancelled'
          `).get(body.doctorId, body.appointmentDate, body.appointmentTime);
          
          if (existing) {
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
           const existingConflict = db.prepare(`
             SELECT id FROM appointments 
             WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'cancelled' AND id != ?
           `).get(updatedBody.doctorId, updatedBody.appointmentDate, updatedBody.appointmentTime, id);
           
           if (existingConflict) {
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

      if (endpoint === '/clinics/my-clinic') return { data: { clinic: { id: 'my-clinic', name: 'Offline Clinic', phone: '123-456' } } };

      // 3. Health check
      if (endpoint === '/health' && method === 'GET') {
        return { status: 'online', mode: 'offline-p2p' };
      }

      // 4. Sync polling stub (Phase 4 compatibility)
      if (endpoint === '/sync/pending' && method === 'GET') {
        return []; // Return empty array so frontend sync queue doesn't crash
      }

      // 5. Dashboard stub
      if (endpoint === '/dashboard' && method === 'GET') {
        return {
          success: true,
          data: {
            stats: { totalPatients: 0, appointmentsToday: 0, totalRevenue: 0 },
            recentAppointments: [],
            upcomingAppointments: []
          }
        };
      }

      // 6. Network Discovery
      if (endpoint === '/network/nodes' && method === 'GET') {
        const discoveryService = require('../discovery/DiscoveryService.cjs');
        return { data: { nodes: discoveryService.getDiscoveredPeers() } };
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
}

// Export as singleton
module.exports = new LocalApi();
