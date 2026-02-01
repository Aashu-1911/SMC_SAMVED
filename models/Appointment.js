const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },

  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },

  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Patient Details
  patientName: {
    type: String,
    required: true,
  },

  patientAge: {
    type: Number,
    required: true,
  },

  patientGender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: true,
  },

  patientPhone: {
    type: String,
    required: true,
  },

  // Appointment Details
  appointmentDate: {
    type: Date,
    required: true,
  },

  appointmentTime: {
    type: String,
    required: true,
  },

  reason: {
    type: String,
    required: true,
  },

  // Status
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending",
  },

  notes: {
    type: String,
    default: "",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
