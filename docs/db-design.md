# DATABASE DESIGN DOCUMENT

# Project

ClinicFlow

Version: 1.0

Database: MongoDB

ODM: Mongoose

---

# DATABASE DESIGN PRINCIPLES

1. Multi-Tenant Architecture
2. Offline-First Support
3. Auditability
4. Scalability
5. Data Isolation

Every business collection MUST contain:

clinicId

This ensures complete tenant isolation.

---

# DATABASE RELATIONSHIP OVERVIEW

Clinic
│
├── Users
│
├── Doctors
│
├── Patients
│
├── Appointments
│
├── Consultations
│
└── Prescriptions

---

# COLLECTION 1: CLINICS

Purpose:

Stores clinic information.

Collection:

clinics

Schema:

```json
{
  "_id": "ObjectId",
  "name": "City Care Clinic",
  "email": "clinic@email.com",
  "phone": "9876543210",
  "address": {
    "street": "",
    "city": "",
    "state": "",
    "country": "",
    "pincode": ""
  },
  "logo": "",
  "isActive": true,
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Indexes:

```text
email
phone
```

---

# COLLECTION 2: USERS

Purpose:

System login accounts.

Collection:

users

Roles:

* clinic_admin
* doctor
* receptionist

Schema:

```json
{
  "_id": "ObjectId",
  "clinicId": "ObjectId",
  "name": "",
  "email": "",
  "password": "",
  "role": "clinic_admin",
  "phone": "",
  "isActive": true,
  "lastLogin": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Indexes:

```text
clinicId
email
role
```

Unique:

```text
email
```

---

# COLLECTION 3: DOCTORS

Purpose:

Doctor profiles and schedules.

Collection:

doctors

Schema:

```json
{
  "_id": "ObjectId",
  "clinicId": "ObjectId",
  "userId": "ObjectId",

  "doctorCode": "DOC001",

  "name": "",
  "email": "",
  "phone": "",

  "specialization": "",
  "qualification": "",
  "experience": 5,

  "availability": {
    "workingDays": [],
    "startTime": "09:00",
    "endTime": "18:00"
  },

  "isActive": true,

  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Indexes:

```text
clinicId
doctorCode
specialization
```

---

# COLLECTION 4: PATIENTS

Purpose:

Patient records.

Collection:

patients

Schema:

```json
{
  "_id": "ObjectId",

  "clinicId": "ObjectId",

  "patientId": "PAT0001",

  "firstName": "",
  "lastName": "",

  "gender": "",
  "dateOfBirth": "Date",

  "phone": "",
  "email": "",

  "bloodGroup": "",

  "address": {
    "street": "",
    "city": "",
    "state": "",
    "country": "",
    "pincode": ""
  },

  "emergencyContact": {
    "name": "",
    "phone": "",
    "relationship": ""
  },

  "createdBy": "ObjectId",

  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Indexes:

```text
clinicId
patientId
phone
firstName
lastName
```

Unique:

```text
patientId
```

---

# COLLECTION 5: APPOINTMENTS

Purpose:

Appointment booking and queue management.

Collection:

appointments

Schema:

```json
{
  "_id": "ObjectId",

  "clinicId": "ObjectId",

  "patientId": "ObjectId",

  "doctorId": "ObjectId",

  "appointmentDate": "Date",

  "appointmentTime": "10:00",

  "status": "scheduled",

  "queueNumber": 1,

  "reason": "",

  "checkedInAt": "Date",

  "startedAt": "Date",

  "completedAt": "Date",

  "createdBy": "ObjectId",

  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Status Values:

```text
scheduled
checked_in
in_consultation
completed
cancelled
```

Indexes:

```text
clinicId
patientId
doctorId
appointmentDate
status
```

---

# COLLECTION 6: CONSULTATIONS

Purpose:

Doctor consultation records.

Collection:

consultations

Schema:

```json
{
  "_id": "ObjectId",

  "clinicId": "ObjectId",

  "appointmentId": "ObjectId",

  "patientId": "ObjectId",

  "doctorId": "ObjectId",

  "symptoms": "",

  "diagnosis": "",

  "notes": "",

  "followUpDate": "Date",

  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Indexes:

```text
clinicId
patientId
doctorId
appointmentId
```

---

# COLLECTION 7: PRESCRIPTIONS

Purpose:

Medicine prescriptions.

Collection:

prescriptions

Schema:

```json
{
  "_id": "ObjectId",

  "clinicId": "ObjectId",

  "consultationId": "ObjectId",

  "patientId": "ObjectId",

  "doctorId": "ObjectId",

  "medicines": [
    {
      "name": "",
      "dosage": "",
      "frequency": "",
      "duration": "",
      "instructions": ""
    }
  ],

  "additionalNotes": "",

  "createdAt": "Date",
  "updatedAt": "Date"
}
```

Indexes:

```text
clinicId
patientId
doctorId
consultationId
```

---

# COLLECTION 8: SYNC_LOGS

Purpose:

Offline synchronization tracking.

Collection:

sync_logs

Schema:

```json
{
  "_id": "ObjectId",

  "clinicId": "ObjectId",

  "deviceId": "",

  "entityType": "",

  "entityId": "",

  "operation": "",

  "syncStatus": "",

  "syncedAt": "Date",

  "createdAt": "Date"
}
```

Operation Values:

```text
create
update
delete
```

Sync Status:

```text
pending
synced
failed
```

Indexes:

```text
clinicId
entityType
syncStatus
```

---

# RELATIONSHIPS

Clinic

1 → Many Users

1 → Many Doctors

1 → Many Patients

1 → Many Appointments

---

Patient

1 → Many Appointments

1 → Many Consultations

1 → Many Prescriptions

---

Doctor

1 → Many Appointments

1 → Many Consultations

1 → Many Prescriptions

---

Appointment

1 → 1 Consultation

---

Consultation

1 → Many Prescriptions

---

# SOFT DELETE STRATEGY

Do not physically delete records.

Use:

```json
{
  "isDeleted": false,
  "deletedAt": null
}
```

for:

* Patients
* Doctors
* Appointments
* Consultations
* Prescriptions

---

# V1 COLLECTIONS

✓ clinics

✓ users

✓ doctors

✓ patients

✓ appointments

✓ consultations

✓ prescriptions

✓ sync_logs

---
