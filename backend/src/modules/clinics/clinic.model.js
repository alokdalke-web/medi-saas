const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema(
  {
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
