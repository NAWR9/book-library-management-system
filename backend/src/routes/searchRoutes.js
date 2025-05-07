const express = require("express");
const router = express.Router();
const { searchBooks } = require("../controllers/searchController");

router.get("/", searchBooks);

module.exports = router;
