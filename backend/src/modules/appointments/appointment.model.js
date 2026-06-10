const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Appointment must belong to a patient'],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Appointment must be assigned to a doctor'],
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Please provide an appointment date'],
    },
    appointmentTime: {
      type: String,
      required: [true, 'Please provide an appointment time'],
    },
    status: {
      type: String,
      enum: ['scheduled', 'checked_in', 'in_consultation', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    queueNumber: {
      type: Number,
      default: 1,
    },
    reason: {
      type: String,
    },
    checkedInAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ clinicId: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ status: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;
