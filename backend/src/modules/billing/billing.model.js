const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  billingId: {
    type: String,
    unique: true
  },
  clinicId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Clinic',
    required: [true, 'Invoice must belong to a clinic']
  },
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Patient',
    required: [true, 'Invoice must belong to a patient']
  },
  appointmentId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Appointment'
  },
  amount: {
    type: Number,
    required: [true, 'Invoice must have an amount'],
    min: [0, 'Amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'Insurance', 'Other'],
    default: 'Cash'
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate a unique billing ID before saving
billingSchema.pre('save', async function(next) {
  if (this.isNew && !this.billingId) {
    const count = await mongoose.model('Billing').countDocuments();
    this.billingId = `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

const Billing = mongoose.model('Billing', billingSchema);

module.exports = Billing;
