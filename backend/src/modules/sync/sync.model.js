const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Using the UUID from desktop
  node_id: { type: String, required: true },
  event_type: { type: String, required: true },
  entity_type: { type: String, required: true },
  entity_id: { type: String, required: true },
  payload: { type: String, required: true },
  version: { type: Number, required: true },
  created_at: { type: Date, required: true }
}, { timestamps: true });

eventSchema.index({ entity_id: 1, version: 1 }, { unique: true });
eventSchema.index({ created_at: 1 });

module.exports = mongoose.model('Event', eventSchema);
