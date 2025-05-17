const express = require("express");
const router = express.Router();
const { getBookDetails } = require("../controllers/bookDetailsController");

router.get("/", getBookDetails);

module.exports = router;
