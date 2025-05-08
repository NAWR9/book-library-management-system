const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  name_en: {
    type: String,
    required: [true, "Please provide an English category name"],
    trim: true,
    unique: true,
  },
  name_ar: {
    type: String,
    required: [true, "Please provide an Arabic category name"],
    trim: true,
    unique: true,
  },
  description_en: {
    type: String,
    trim: true,
    default: "",
  },
  description_ar: {
    type: String,
    trim: true,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Category", CategorySchema);
