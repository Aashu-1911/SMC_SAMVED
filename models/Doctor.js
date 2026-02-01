const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },

  name: String,
  specialization: String,
  opdTimings: String,

  // 🔥 NEW
  isAvailable: {
    type: Boolean,
    default: true, // doctor is available by default
  },
});

module.exports = mongoose.model("Doctor", DoctorSchema);
