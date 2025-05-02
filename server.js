require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const i18next = require("i18next");
const Backend = require("i18next-fs-backend");
const i18nextMiddleware = require("i18next-http-middleware");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const jwt = require("jsonwebtoken");

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
app.use(expressLayouts);

// Set up static folder
app.use(express.static(path.join(__dirname, "frontend/public")));

// Set up EJS with layouts
app.set("layout", "layout");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "frontend/views"));

// i18n setup
i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join(__dirname, "backend/src/locales/{{lng}}/{{ns}}.json"),
    },
    fallbackLng: "en",
    preload: ["en", "ar"],
    ns: ["translation"],
    defaultNS: "translation",
    detection: {
      order: ["querystring", "cookie", "header"],
      caches: ["cookie"],
      cookieName: "i18next",
      lookupQuerystring: "lang",
    },
    supportedLngs: ["en", "ar"],
    saveMissing: false,
  });

app.use(cookieParser());
app.use(i18nextMiddleware.handle(i18next));
// i18n locals and user detection
app.use((req, res, next) => {
  res.locals.t = req.t;
  res.locals.htmlLang = req.language;
  res.locals.rtl = req.language === "ar";
  res.locals.user = null;
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      res.locals.user = decoded;
    } catch {
      res.clearCookie("token");
    }
  }
  next();
});

// logout clears token cookie
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

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
  res.render("pages/index", {
    title: req.t("titles.home"),
    pageScript: "index",
  });
});

app.get("/login", (req, res) => {
  if (res.locals.user) return res.redirect("/dashboard");
  res.render("pages/login", {
    title: req.t("titles.login"),
    pageScript: "login",
  });
});

app.get("/register", (req, res) => {
  // Public registration page
  if (res.locals.user) {
    return res.redirect("/dashboard");
  }
  res.render("pages/register", {
    title: req.t("titles.register"),
    pageScript: "register",
  });
});

app.get("/dashboard", (req, res) => {
  if (!res.locals.user) return res.redirect("/login");
  res.render("pages/dashboard", {
    title: req.t("titles.dashboard"),
    pageScript: "dashboard",
  });
});

app.get("/profile", (req, res) => {
  if (!res.locals.user) return res.redirect("/login");
  res.render("pages/profile", {
    title: req.t("titles.profile"),
    pageScript: "profile",
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
