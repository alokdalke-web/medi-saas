const mongoose = require('mongoose');
const crypto = require('crypto');

const doctorSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => crypto.randomUUID() },
    clinicId: {
      type: String,
      ref: 'Clinic',
      required: [true, 'Doctor must belong to a clinic'],
    },
    userId: {
      type: String,
      ref: 'User',
      required: [true, 'Doctor must be linked to a user account'],
    },
    doctorCode: {
      type: String,
      required: [true, 'Doctor must have a unique code'],
    },
    name: {
      type: String,
      required: [true, 'Please provide a name'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
    },
    specialization: {
      type: String,
      required: [true, 'Please provide a specialization'],
    },
    qualification: {
      type: String,
      required: [true, 'Please provide qualifications'],
    },
    experience: {
      type: Number,
      default: 0,
    },
    availability: {
      workingDays: {
        type: [String],
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      startTime: {
        type: String,
        default: '09:00'
      },
      endTime: {
        type: String,
        default: '18:00'
      }
    },
    isActive: {
      type: Boolean,
      default: true,
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

doctorSchema.index({ clinicId: 1 });
doctorSchema.index({ doctorCode: 1 });
doctorSchema.index({ specialization: 1 });

// Query middleware to hide soft-deleted doctors
doctorSchema.pre(/^find/, function() {
  this.find({ isDeleted: { $ne: true } });
});

const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;
