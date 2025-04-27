require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Import routes
const authRoutes = require("./backend/src/routes/authRoutes");

const app = express();

// CORS configuration
const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up static folder
app.use(express.static(path.join(__dirname, "frontend/public")));

// Set up EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "frontend/views"));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// API Routes
app.use("/api/auth", authRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// Frontend routes (EJS views)
app.get("/", (req, res) => {
  res.render("pages/index", { title: "Home" });
});

app.get("/login", (req, res) => {
  res.render("pages/login", { title: "Login" });
});

app.get("/register", (req, res) => {
  res.render("pages/register", { title: "Register" });
});

app.get("/dashboard", (req, res) => {
  res.render("pages/dashboard", { title: "Dashboard" });
});

app.get("/profile", (req, res) => {
  res.render("pages/profile", { title: "Profile" });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
