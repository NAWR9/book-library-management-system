const express = require("express");
const router = express.Router();
const { smartSearchBookInfo } = require("../controllers/smartSearchController");

router.get("/", async (req, res) => {
  const { question, title } = req.query;
  try {
    const result = await smartSearchBookInfo(question, title);
    res.json({ success: true, answer: result.split(" ") });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
