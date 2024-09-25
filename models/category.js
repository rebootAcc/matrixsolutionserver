// models/Category.js
const mongoose = require("mongoose");

const lavel4CategorySchema = new mongoose.Schema({
  name: String,
});

const lavel3CategorySchema = new mongoose.Schema({
  name: String,
  lavel4CategorySchema: [lavel4CategorySchema],
});

const subSubCategorySchema = new mongoose.Schema({
  name: String,
  lavel3CategorySchema: [lavel3CategorySchema],
});

const subCategorySchema = new mongoose.Schema({
  name: String,
  subsubcategories: [subSubCategorySchema],
});

const categorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: String,
      unique: true,
      required: true,
    },
    mainCategory: {
      type: String,
      unique: true,
      required: true,
    },
    subcategories: [subCategorySchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", categorySchema);
