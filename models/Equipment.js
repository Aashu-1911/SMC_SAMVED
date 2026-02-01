const mongoose = require("mongoose");

const EquipmentSchema = new mongoose.Schema({
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

  condition: {
    type: String,
    enum: ["working", "maintenance", "out_of_order"],
    default: "working",
  },

  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Equipment", EquipmentSchema);
