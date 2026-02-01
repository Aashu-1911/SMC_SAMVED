module.exports.ensureHospital = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }

  if (req.user.role !== "hospital") {
    return res.status(403).send("Access denied: Hospital only");
  }

  next();
};

module.exports.ensureAdmin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }

  if (req.user.role !== "admin") {
    return res.status(403).send("Access denied: Admin only");
  }

  next();
};

module.exports.ensureCitizen = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }

  if (req.user.role !== "citizen") {
    return res.status(403).send("Access denied: Citizen only");
  }

  next();
};
