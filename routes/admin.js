const express = require("express");
const router = express.Router();

const Hospital = require("../models/Hospital");
const Patient = require("../models/Patient");
const { ensureAdmin } = require("../middleware/auth");

// Admin dashboard
router.get("/dashboard", ensureAdmin, async (req, res) => {
  const hospitals = await Hospital.find();
  const patients = await Patient.find().populate("hospital");

  res.render("dashboards/admin", { hospitals, patients });
});


// Disease-wise analytics
router.get("/analytics/disease", ensureAdmin, async (req, res) => {
  const data = await Patient.aggregate([
    {
      $group: {
        _id: "$disease",
        totalCases: { $sum: 1 },
      },
    },
  ]);

  res.render("admin/diseaseAnalytics", { data });
});


// Ward-wise analytics
router.get("/analytics/ward", ensureAdmin, async (req, res) => {
  const data = await Patient.aggregate([
    {
      $lookup: {
        from: "hospitals",
        localField: "hospital",
        foreignField: "_id",
        as: "hospital",
      },
    },
    { $unwind: "$hospital" },
    {
      $group: {
        _id: "$hospital.ward",
        totalCases: { $sum: 1 },
      },
    },
  ]);

  res.render("admin/wardAnalytics", { data });
});

module.exports = router;
