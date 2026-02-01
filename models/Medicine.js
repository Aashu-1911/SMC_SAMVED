const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital",
    required: true,
  },

  name: {
    type: String,
    required: true,
  },

  quantity: {
    type: Number,
    default: 0,
  },

  unit: {
    type: String, // tablets, bottles, strips
  },

  status: {
    type: String,
    enum: ["adequate", "low", "out_of_stock"],
    default: "adequate",
  },

  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Medicine", MedicineSchema);
