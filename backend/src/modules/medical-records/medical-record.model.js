const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  clinicId: {
    type: String,
    required: true,
    ref: 'Clinic'
  },
  patientId: {
    type: String,
    required: true,
    ref: 'Patient'
  },
  doctorId: {
    type: String,
    required: true,
    ref: 'Doctor'
  },
  recordType: {
    type: String,
    required: true,
    enum: ['note', 'prescription', 'referral']
  },
  content: {
    type: mongoose.Schema.Types.Mixed, // JSON string stored as object
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true,
  _id: false // because we set it manually
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
