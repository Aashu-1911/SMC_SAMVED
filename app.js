require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");

const connectDB = require("./config/db");

const app = express();
connectDB();

// View Engine
app.set("view engine", "ejs");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.use(
  session({
    secret: "smc_health_secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Routes
app.use("/", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/hospital", require("./routes/hospital"));
app.use("/citizen", require("./routes/citizen"));

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
