require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const i18next = require("i18next");
const Backend = require("i18next-fs-backend");
const i18nextMiddleware = require("i18next-http-middleware");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const jwt = require("jsonwebtoken");
const bookRoutes = require("./backend/src/routes/bookRoutes");
const searchRoutes = require("./backend/src/routes/searchRoutes");
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
app.use(cookieParser());

// Set up sessions and flash messages
app.use(
  session({
    secret: process.env.SESSION_SECRET || "librarysecret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  }),
);
app.use(flash());

app.use(expressLayouts);

// Set up static folder
app.use(express.static(path.join(__dirname, "frontend/public")));

//search Route
app.use("/api/search", searchRoutes);

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

app.use(i18nextMiddleware.handle(i18next));

// Pass flash messages to all views
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

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
app.use("/api/books", bookRoutes);

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

app.get("/forgot-password", (req, res) => {
  if (res.locals.user) return res.redirect("/dashboard");
  res.render("pages/auth/forgot-password", {
    title: req.t("titles.forgotPassword"),
    pageScript: "forgot-password",
  });
});

app.get("/reset-password", (req, res) => {
  if (res.locals.user) return res.redirect("/dashboard");

  // Get token from query parameter
  const token = req.query.token;

  // Token might be part of a larger URL if coming from a service like temp-mail
  // Try to extract it if there's a "token=" in the URL
  if (!token && req.originalUrl) {
    const tokenMatch = req.originalUrl.match(/token=([a-f0-9]+)/i);
    if (tokenMatch && tokenMatch[1]) {
      return res.redirect(`/reset-password?token=${tokenMatch[1]}`);
    }
  }

  if (!token) {
    req.flash("error", "Invalid or missing password reset token.");
    return res.redirect("/login");
  }

  res.render("pages/auth/reset-password", {
    title: req.t("titles.resetPassword"),
    pageScript: "reset-password",
    token: token,
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

app.get("/search", (req, res) => {
  res.render("pages/search", {
    title: "Search Books",
    pageScript: "search",
  });
});

// Dummy book data
let books = [
  {
    title:
      "Hands-On Machine Learning with Scikit-Learn," +
      " Keras, and TensorFlow: Concepts, Tools, and Techniques to Build Intelligent Systems" +
      " 2nd Edition",
    author: "Aurélien Géron",
    cover:
      "https://m.media-amazon.com/images/I/81R5BmGtv-L._AC_UF1000,1000_QL80_.jpg",
  },
  {
    title:
      "Learn Java 17 Programming - " +
      "Second Edition: Learn the fundamentals" +
      " of Java Programming with this updated guide" +
      " with the latest features",
    author: " Nick Samoylov",
    cover:
      "https://m.media-amazon.com/images/I/81wQIyojm1L._AC_UF1000,1000_QL80_.jpg",
  },
];

app.get("/books", (req, res) => {
  if (!res.locals.user) return res.redirect("/login");
  res.render("pages/books", {
    title: req.t("titles.books"),
    pageScript: "books",
    books: books,
  });
});

app.get("/books/new", (req, res) => {
  res.render("new");
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).render("pages/error", {
    title: req.t("titles.notFound") || req.t("errors.pageNotFound"),
    errorCode: 404,
    errorMessage: req.t("errors.pageNotFound"),
  });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("pages/error", {
    title: req.t("errors.serverError"),
    errorCode: 500,
    errorMessage: req.t("errors.serverError"),
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
