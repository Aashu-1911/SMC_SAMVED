const express = require("express");
const router = express.Router();

const Patient = require("../models/Patient");
const Hospital = require("../models/Hospital");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

const { ensureHospital } = require("../middleware/auth");
const Equipment = require("../models/Equipment");
const Medicine = require("../models/Medicine");
router.get("/dashboard", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  // ================= FETCH DATA =================
  const patients = await Patient
    .find({ hospital: hospital._id })
    .populate("doctor");

  const doctors = await Doctor.find({ hospital: hospital._id });

  // ================= FETCH APPOINTMENTS =================
  const appointments = await Appointment.find({ hospital: hospital._id })
    .populate("doctor")
    .populate("citizen")
    .sort({ appointmentDate: -1 });

  // ================= PATIENT METRICS =================
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysOPD = patients.filter(p =>
    p.patientType === "OPD" &&
    p.admissionDate &&
    new Date(p.admissionDate) >= today
  ).length;

  const currentIPD = patients.filter(
    p => p.patientType === "IPD" && !p.dischargeDate
  ).length;

  // ================= BED CALCULATION =================
  let totalBeds = 0;
  let availableBeds = 0;

  if (hospital.beds) {
    Object.values(hospital.beds).forEach(bed => {
      totalBeds += bed.total || 0;
      availableBeds += bed.available || 0;
    });
  }

  const occupiedBeds = totalBeds - availableBeds;

  const bedOccupancyPercent =
    totalBeds > 0
      ? Math.round((occupiedBeds / totalBeds) * 100)
      : 0;

  const emergencyStatus =
    bedOccupancyPercent >= 80 ? "High Load" : "Normal";

  // ================= RENDER =================
  res.render("dashboards/hospital", {
    hospital,
    patients,
    doctors,
    appointments,
    totalBeds,
    availableBeds,
    stats: {
      todaysOPD,
      currentIPD,
      bedOccupancyPercent,
      emergencyStatus,
    },
  });
});





// ---------- PATIENT ----------

// Register patient form
router.get("/patients/new", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });
  const doctors = await Doctor.find({
  hospital: hospital._id,
  isAvailable: true
});

  console.log(doctors); 

  res.render("hospital/addPatient", { doctors });
});


// Register patient
router.post("/patients", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  const {
    patientType,
    name,
    age,
    gender,
    disease,
    doctor,
    bedType,
    admissionDate,
  } = req.body;

  // ✅ BED CHECK ONLY FOR IPD
  if (patientType === "IPD") {
    if (!bedType) {
      return res.send("Please select bed type for IPD patient");
    }

    if (!hospital.beds[bedType]) {
      return res.send("Invalid bed type selected");
    }

    if (hospital.beds[bedType].available <= 0) {
      return res.send("Selected bed type not available");
    }
  }

  const finalAdmissionDate =
    patientType === "IPD" && admissionDate
      ? new Date(admissionDate)
      : new Date();

  await Patient.create({
    hospital: hospital._id,
    patientType,
    name,
    age,
    gender,
    disease,
    doctor: doctor || null,
    bedType: patientType === "IPD" ? bedType : undefined,
    admissionDate: finalAdmissionDate,
  });

  // 🔻 Reduce beds ONLY for IPD
  if (patientType === "IPD") {
    hospital.beds[bedType].available -= 1;
    await hospital.save();
  }

  res.redirect("/hospital/dashboard");
});






// Discharge patient
router.post("/patients/:id/discharge", ensureHospital, async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (patient.dischargeDate) return res.redirect("/hospital/dashboard");

  patient.dischargeDate = new Date();
  await patient.save();

  const hospital = await Hospital.findById(patient.hospital);

  // 🔺 Increase bed availability
  if (patient.bedType) {
    hospital.beds[patient.bedType].available += 1;
    await hospital.save();
  }

  res.redirect("/hospital/dashboard");
});




// ---------- DOCTOR ----------

// Show all doctors
router.get("/doctors", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });
  const doctors = await Doctor.find({ hospital: hospital._id });

  res.render("hospital/doctors", { hospital, doctors });
});

// Show add doctor form
router.get("/doctors/new", ensureHospital, async (req, res) => {
  res.render("hospital/addDoctor");
});

// Handle add doctor
router.post("/doctors", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  const { name, specialization, opdTimings, phone, experienceYears } = req.body;

  await Doctor.create({
    hospital: hospital._id,
    name,
    specialization,
    opdTimings,
    phone,
    experienceYears,
  });

  res.redirect("/hospital/doctors");
});

router.get("/doctors/workload", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  const doctors = await Doctor.find({ hospital: hospital._id });

  // Fetch all patients of this hospital
  const patients = await Patient
    .find({ hospital: hospital._id })
    .populate("doctor");

  // Build workload data
  const workload = doctors.map(doc => {
    const opdCount = patients.filter(
      p => p.doctor && p.doctor._id.equals(doc._id) && p.patientType === "OPD"
    ).length;

    const ipdAdmitted = patients.filter(
      p =>
        p.doctor &&
        p.doctor._id.equals(doc._id) &&
        p.patientType === "IPD" &&
        !p.dischargeDate
    ).length;

    const ipdDischarged = patients.filter(
      p =>
        p.doctor &&
        p.doctor._id.equals(doc._id) &&
        p.patientType === "IPD" &&
        p.dischargeDate
    ).length;

    return {
      doctor: doc,
      opdCount,
      ipdAdmitted,
      ipdDischarged,
      total: opdCount + ipdAdmitted + ipdDischarged,
    };
  });

  res.render("hospital/doctorWorkload", {
    hospital,
    workload,
  });
});

router.post("/doctors/:id/toggle", ensureHospital, async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    return res.status(404).send("Doctor not found");
  }

  doctor.isAvailable = !doctor.isAvailable;
  await doctor.save();

  res.redirect("/hospital/doctors");
});



// ---------- equipments ----------

router.get("/resources", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  const equipments = await Equipment.find({ hospital: hospital._id });
  const medicines = await Medicine.find({ hospital: hospital._id });

  res.render("hospital/resources", {
    hospital,
    equipments,
    medicines,
  });
});


router.post("/equipment", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  const { name, quantity, condition } = req.body;

  await Equipment.create({
    hospital: hospital._id,
    name,
    quantity,
    condition,
  });

  res.redirect("/hospital/resources");
});

router.post("/equipment/:id/edit", ensureHospital, async (req, res) => {
  console.log("EDIT EQUIPMENT BODY:", req.body); // 👈 ADD THIS

  const { name, quantity, condition } = req.body;

  await Equipment.findByIdAndUpdate(req.params.id, {
    name,
    quantity,
    condition,
    lastUpdated: new Date(),
  });

  res.redirect("/hospital/resources");
});


router.post("/equipment/:id/delete", ensureHospital, async (req, res) => {
  await Equipment.findByIdAndDelete(req.params.id);
  res.redirect("/hospital/resources");
});



router.post("/medicine", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  const { name, quantity, unit, status } = req.body;

  await Medicine.create({
    hospital: hospital._id,
    name,
    quantity,
    unit,
    status,
  });

  res.redirect("/hospital/resources");
});

router.post("/medicine/:id/edit", ensureHospital, async (req, res) => {
  const { name, quantity, unit, status } = req.body;

  await Medicine.findByIdAndUpdate(req.params.id, {
    name,
    quantity,
    unit,
    status,
    lastUpdated: new Date(),
  });

  res.redirect("/hospital/resources");
});

router.post("/medicine/:id/delete", ensureHospital, async (req, res) => {
  await Medicine.findByIdAndDelete(req.params.id);
  res.redirect("/hospital/resources");
});








// ---------- BEDS ----------

// Update bed availability
router.post("/beds/update", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  hospital.availableBeds = req.body.availableBeds;
  await hospital.save();

  res.redirect("/hospital/dashboard");
});



// ---------- ANALYTICS DASHBOARD ----------
router.get("/analytics", ensureHospital, async (req, res) => {
  const hospital = await Hospital.findOne({ user: req.user._id });

  // ================= PATIENT DATA =================
  const patients = await Patient
    .find({ hospital: hospital._id })
    .populate("doctor");

  const opdCount = patients.filter(p => p.patientType === "OPD").length;

  const ipdCount = patients.filter(
    p => p.patientType === "IPD" && !p.dischargeDate
  ).length;

  // Today OPD
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOpdCount = patients.filter(
    p =>
      p.patientType === "OPD" &&
      p.admissionDate &&
      new Date(p.admissionDate) >= today
  ).length;

  // ================= BED CALCULATION =================
  let totalBeds = 0;
  let availableBeds = 0;

  if (hospital.beds) {
    Object.values(hospital.beds).forEach(bed => {
      totalBeds += bed.total || 0;
      availableBeds += bed.available || 0;
    });
  }

  // ================= DOCTOR LOAD =================
  const doctors = await Doctor.find({ hospital: hospital._id });

  const doctorStats = doctors.map(doc => {
    const patientsCount = patients.filter(
      p => p.doctor && p.doctor._id.equals(doc._id)
    ).length;

    return {
      name: doc.name,
      specialization: doc.specialization,
      patientsCount,
    };
  });

  // ================= MEDICINE =================
  const medicines = await Medicine.find({ hospital: hospital._id });

  const medicineStats = medicines.map(m => ({
    name: m.name,
    quantity: m.quantity,
    status: m.status,
  }));

  // ================= EQUIPMENT =================
  const equipments = await Equipment.find({ hospital: hospital._id });

  const equipmentStats = equipments.map(e => ({
    name: e.name,
    quantity: e.quantity,
    condition: e.condition,
  }));

  // ================= RENDER =================
  res.render("hospital/analytics", {
    hospital,

    totalBeds,
    availableBeds,
    bedsByType: hospital.beds || {},

    opdCount,
    ipdCount,
    todayOpdCount,

    doctorStats,
    medicineStats,
    equipmentStats,
  });
});

// =====================================================
// APPOINTMENT MANAGEMENT
// =====================================================

// Update appointment status
router.post("/appointments/:id/status", ensureHospital, async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id });
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      hospital: hospital._id
    });

    if (!appointment) {
      return res.status(404).send("Appointment not found");
    }

    appointment.status = req.body.status;
    if (req.body.notes) {
      appointment.notes = req.body.notes;
    }
    await appointment.save();

    res.redirect("/hospital/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating appointment");
  }
});

// Get appointments as JSON (for AJAX)
router.get("/appointments/json", ensureHospital, async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id });
    const appointments = await Appointment.find({ hospital: hospital._id })
      .populate("doctor")
      .populate("citizen")
      .sort({ appointmentDate: -1 });

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: "Error fetching appointments" });
  }
});

module.exports = router;
