const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },

  name: {
    type: String,
    required: true,
  },

  specialization: String,

  opdTimings: String,

  phone: {
    type: String,   // 👈 ADD THIS
  },

  experienceYears: {
    type: Number,   // optional but useful
  },

  isAvailable: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Doctor", DoctorSchema);
