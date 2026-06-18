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
        eventStoreService.saveEvent('PatientUpdated', 'patients', id, body, body.expectedVersion || 0, token || 'local_admin_1');
        return { data: { patient: { _id: id, ...body } } };
      }
      if (endpoint.startsWith('/patients/') && method === 'DELETE') {
        const id = endpoint.split('/')[2];
        eventStoreService.saveEvent('PatientDeleted', 'patients', id, { isDeleted: true }, 0, token || 'local_admin_1');
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
        eventStoreService.saveEvent('DoctorUpdated', 'doctors', id, body, body.expectedVersion || 0, token || 'local_admin_1');
        return { data: { doctor: { _id: id, ...body } } };
      }
      if (endpoint.startsWith('/doctors/') && method === 'DELETE') {
        const id = endpoint.split('/')[2];
        eventStoreService.saveEvent('DoctorDeleted', 'doctors', id, { isDeleted: true }, 0, token || 'local_admin_1');
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
        eventStoreService.saveEvent('UserUpdated', 'users', id, body, body.expectedVersion || 0, token || 'local_admin_1');
        return { data: { user: { _id: id, ...body } } };
      }
      if (endpoint.startsWith('/users/') && method === 'DELETE') {
        const id = endpoint.split('/')[2];
        eventStoreService.saveEvent('UserDeleted', 'users', id, { isDeleted: true }, 0, token || 'local_admin_1');
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
          const id = crypto.randomUUID();
          eventStoreService.saveEvent('AppointmentCreated', 'appointments', id, body, 0, token || 'local_admin_1');
          return { data: { appointment: { _id: id, ...body } } };
        }
      }
      if (endpoint.startsWith('/appointments/') && method === 'PUT') {
        const id = endpoint.split('/')[2];
        eventStoreService.saveEvent('AppointmentUpdated', 'appointments', id, body, body.expectedVersion || 0, token || 'local_admin_1');
        return { data: { appointment: { _id: id, ...body } } };
      }
      if (endpoint.startsWith('/appointments/') && method === 'DELETE') {
        const id = endpoint.split('/')[2];
        eventStoreService.saveEvent('AppointmentDeleted', 'appointments', id, { isDeleted: true }, 0, token || 'local_admin_1');
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
