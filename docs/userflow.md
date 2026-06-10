# USER ROLES (V1)

## Clinic Admin

Responsibilities:

* Manage clinic settings
* Manage users
* View reports
* Manage doctors
* Manage appointments
* Manage patients

---

## Receptionist

Responsibilities:

* Register patients
* Search patients
* Manage appointments
* Check-in patients
* Generate bills
* View patient records

---

## Doctor

Responsibilities:

* View appointments
* Access patient records
* Create consultation notes
* Create prescriptions
* Manage follow-ups

---

# CORE USER FLOWS

## Flow 1: Clinic Setup

Clinic Registration
↓
Create Clinic
↓
Create Admin Account
↓
Login
↓
Dashboard

---

## Flow 2: User Management

Clinic Admin
↓
Users
↓
Add Doctor / Receptionist
↓
Assign Role
↓
Activate User

---

## Flow 3: Patient Registration

Receptionist
↓
Patients
↓
Add Patient
↓
Save Patient
↓
Generate Patient ID
↓
Patient Profile

---

## Flow 4: Search Existing Patient

Receptionist
↓
Search Patient
↓
View Patient Profile
↓
Book Appointment

---

## Flow 5: Appointment Booking

Receptionist
↓
Select Patient
↓
Select Doctor
↓
Select Date & Time
↓
Availability Check
↓
Confirm Appointment

---

## Flow 6: Patient Check-In

Receptionist
↓
Today's Appointments
↓
Patient Arrives
↓
Check-In
↓
Waiting Queue

---

## Flow 7: Doctor Consultation

Doctor
↓
Today's Queue
↓
Open Patient Record
↓
Review History
↓
Consult Patient
↓
Add Diagnosis
↓
Add Notes
↓
Save Consultation

---

## Flow 8: Prescription Creation

Doctor
↓
Consultation
↓
Add Medicines
↓
Add Dosage
↓
Add Instructions
↓
Save Prescription
↓
Print / Download

---

## Flow 9: Follow-Up Appointment

Doctor
↓
Consultation
↓
Recommend Follow-Up
↓
Receptionist Books Appointment

---

## Flow 10: Billing

Receptionist
↓
Completed Consultation
↓
Generate Invoice
↓
Collect Payment
↓
Generate Receipt

---

## Flow 11: Patient History

Patient Profile
↓
Appointments
↓
Consultations
↓
Prescriptions
↓
Invoices

---

## Flow 12: Offline Mode

Internet Lost
↓
Offline Banner
↓
Continue Working
↓
Store Data Locally

Supported Offline:

* Patient Registration
* Appointment Booking
* Consultation Notes
* Prescriptions
* Billing

---

## Flow 13: Sync

Internet Restored
↓
Push Local Changes
↓
Resolve Conflicts
↓
Pull Latest Data
↓
Sync Complete

---

# V1 MODULES

Authentication
Users
Patients
Doctors
Appointments
Consultations
Prescriptions
Billing
Reports
Offline Sync

# EXCLUDED FROM V1

Super Admin
Pharmacy
Laboratory
Inventory
Accounting
Subscription Management
Advanced Analytics

These modules will be implemented in V2 after core clinic operations are stable.
