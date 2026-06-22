const mongoose = require('mongoose');
const crypto = require('crypto');

const clinicSchema = new mongoose.Schema(
  {
    _id: { type: String, default: () => crypto.randomUUID() },
    name: {
      type: String,
      required: [true, 'Clinic name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Clinic email is required'],
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Clinic phone is required'],
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    logo: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

clinicSchema.index({ email: 1 });
clinicSchema.index({ phone: 1 });

const Clinic = mongoose.model('Clinic', clinicSchema);
module.exports = Clinic;
