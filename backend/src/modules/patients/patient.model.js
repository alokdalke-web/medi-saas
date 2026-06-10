const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Patient must belong to a clinic'],
    },
    patientId: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: [true, 'Please provide a first name'],
    },
    lastName: {
      type: String,
      required: [true, 'Please provide a last name'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: [true, 'Please provide a gender'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Please provide a date of birth'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
    },
    email: {
      type: String,
      lowercase: true,
    },
    bloodGroup: {
      type: String,
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relationship: { type: String, default: '' },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

patientSchema.index({ clinicId: 1, patientId: 1 }, { unique: true });
patientSchema.index({ phone: 1 });
patientSchema.index({ firstName: 1 });
patientSchema.index({ lastName: 1 });

// Query middleware to hide soft-deleted patients
patientSchema.pre(/^find/, function() {
  if (this.getOptions().ignoreSoftDelete) {
    return;
  }
  this.find({ isDeleted: { $ne: true } });
});

// Pre-save hook to generate patientId scoped to clinic
patientSchema.pre('validate', async function () {
  if (this.isNew && !this.patientId) {
    const latestPatient = await this.constructor.findOne(
      { clinicId: this.clinicId }
    ).sort({ createdAt: -1 }).setOptions({ ignoreSoftDelete: true });

    let seq = 1;
    if (latestPatient && latestPatient.patientId) {
      const parts = latestPatient.patientId.split('-');
      if (parts.length === 2 && !isNaN(parts[1])) {
        seq = parseInt(parts[1], 10) + 1;
      }
    }
    this.patientId = `PAT-${seq.toString().padStart(5, '0')}`;
  }
});

const Patient = mongoose.model('Patient', patientSchema);
module.exports = Patient;
