const mongoose = require("mongoose");

const PatientSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },

  patientType: {
    type: String,
    enum: ["OPD", "IPD"],
    required: true,
  },

  name: String,
  age: Number,
  gender: String,

  disease: String,

  // 🔹 NEW: Assigned doctor
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    default: null,
  },

  // IPD only
  roomNumber: String,
  bedNumber: String,
  bedType: {
  type: String,
  enum: ["general", "icu", "isolation"],
},


  admissionDate: {
    type: Date,
    default: Date.now,
  },

  dischargeDate: Date,
});

module.exports = mongoose.model("Patient", PatientSchema);
