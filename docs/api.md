# API CATALOG

# Project

ClinicFlow

Version: 1.0

API Version: v1

Base URL

/api/v1

Authentication

Bearer JWT Token

---

# MODULE 1: AUTHENTICATION

## Login

POST /auth/login

Purpose:
Authenticate user and generate JWT token.

Access:
Public

---

## Logout

POST /auth/logout

Purpose:
Logout current user.

Access:
Authenticated Users

---

## Current User

GET /auth/me

Purpose:
Get logged-in user details.

Access:
Authenticated Users

---

# MODULE 2: USERS

Purpose:
Manage doctors and receptionists.

Access:
Clinic Admin

---

## Create User

POST /users

---

## Get Users

GET /users

Query Params:

* page
* limit
* search

---

## Get User Details

GET /users/:id

---

## Update User

PUT /users/:id

---

## Deactivate User

DELETE /users/:id

---

# MODULE 3: DOCTORS

Purpose:
Doctor profile and availability management.

Access:
Clinic Admin

---

## Create Doctor

POST /doctors

---

## Get Doctors

GET /doctors

Query Params:

* page
* limit
* search
* specialization

---

## Get Doctor

GET /doctors/:id

---

## Update Doctor

PUT /doctors/:id

---

## Delete Doctor

DELETE /doctors/:id

---

## Update Availability

PUT /doctors/:id/availability

---

# MODULE 4: PATIENTS

Purpose:
Patient registration and management.

Access:
Clinic Admin
Receptionist
Doctor (Read Only)

---

## Create Patient

POST /patients

---

## Get Patients

GET /patients

Query Params:

* page
* limit
* search

Search Fields:

* Name
* Phone
* Patient ID

---

## Get Patient

GET /patients/:id

---

## Update Patient

PUT /patients/:id

---

## Delete Patient

DELETE /patients/:id

---

## Patient History

GET /patients/:id/history

Returns:

* Appointments
* Consultations
* Prescriptions

---

# MODULE 5: APPOINTMENTS

Purpose:
Appointment scheduling and queue management.

Access:
Receptionist
Doctor

---

## Create Appointment

POST /appointments

---

## Get Appointments

GET /appointments

Query Params:

* page
* limit
* date
* doctorId
* status

---

## Get Appointment

GET /appointments/:id

---

## Reschedule Appointment

PUT /appointments/:id/reschedule

---

## Cancel Appointment

PUT /appointments/:id/cancel

---

## Check-In Patient

PUT /appointments/:id/checkin

Status:

Scheduled
→ Checked-In

---

## Start Consultation

PUT /appointments/:id/start

Status:

Checked-In
→ In Consultation

---

## Complete Appointment

PUT /appointments/:id/complete

Status:

In Consultation
→ Completed

---

# MODULE 6: CONSULTATIONS

Purpose:
Doctor consultation records.

Access:
Doctor

---

## Create Consultation

POST /consultations

---

## Get Consultations

GET /consultations

Query Params:

* patientId
* doctorId

---

## Get Consultation

GET /consultations/:id

---

## Update Consultation

PUT /consultations/:id

---

# MODULE 7: PRESCRIPTIONS

Purpose:
Prescription generation and management.

Access:
Doctor

---

## Create Prescription

POST /prescriptions

---

## Get Prescriptions

GET /prescriptions

---

## Get Prescription

GET /prescriptions/:id

---

## Update Prescription

PUT /prescriptions/:id

---

## Download PDF

GET /prescriptions/:id/pdf

---

# MODULE 8: DASHBOARD

Purpose:
Summary statistics and clinic overview.

Access:
Clinic Admin

---

## Dashboard Stats

GET /dashboard/stats

Returns:

* Total Patients
* Total Doctors
* Today's Appointments
* Completed Consultations

---

## Recent Appointments

GET /dashboard/recent-appointments

---

## Doctor Performance

GET /dashboard/doctor-performance

---

# MODULE 9: REPORTS

Purpose:
Operational reports.

Access:
Clinic Admin

---

## Patient Report

GET /reports/patients

---

## Appointment Report

GET /reports/appointments

---

## Doctor Report

GET /reports/doctors

---

## Export Patient Report PDF

GET /reports/patients/pdf

---

## Export Appointment Report PDF

GET /reports/appointments/pdf

---

## Export Patient Report CSV

GET /reports/patients/csv

---

## Export Appointment Report CSV

GET /reports/appointments/csv

---

# MODULE 10: OFFLINE SYNC

Purpose:
Offline-first synchronization.

Access:
Authenticated Users

---

## Push Changes

POST /sync/push

Purpose:

Upload locally stored changes.

---

## Pull Changes

GET /sync/pull

Purpose:

Download latest updates from server.

---

## Sync Status

GET /sync/status

Purpose:

View synchronization state.

Returns:

* Last Sync Time
* Pending Changes
* Sync Status

---

# STANDARD RESPONSE FORMAT

Success Response

{
"success": true,
"message": "Operation successful",
"data": {}
}

---

Validation Error

{
"success": false,
"message": "Validation Error",
"errors": []
}

---

Server Error

{
"success": false,
"message": "Internal Server Error"
}

---

# API SUMMARY

Authentication: 3 APIs

Users: 5 APIs

Doctors: 6 APIs

Patients: 6 APIs

Appointments: 7 APIs

Consultations: 4 APIs

Prescriptions: 5 APIs

Dashboard: 3 APIs

Reports: 7 APIs

Offline Sync: 3 APIs

Total APIs: 49

---

# V1 MODULES

✔ Authentication

✔ User Management

✔ Doctor Management

✔ Patient Management

✔ Appointment Management

✔ Consultation Management

✔ Prescription Management

✔ Dashboard

✔ Reports

✔ Offline Sync

---

