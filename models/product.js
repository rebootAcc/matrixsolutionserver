// models/Product.js
const mongoose = require("mongoose");

const SpecificationSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  details: {
    type: [String],
  },
});

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      unique: true,
    },
    categoryName: {
      type: String,
      required: function () {
        return !this.isdraft;
      }, // Required only when not a draft
    },
    subCategoryName: String,
    subSubCategoryName: String,
    level3subCategoryName: String,
    level4subCategoryName: String,

    title: { type: String, required: true }, // Always required
    brand: {
      type: String,
      required: true, // Always required
    },
    brandimage: {
      type: String,
      required: function () {
        return !this.isdraft;
      }, // Required only when not a draft
    },
    modelNumber: { type: String, required: true, unique: true }, // Always required
    price: {
      type: String,
      required: function () {
        return !this.isdraft;
      }, // Required only when not a draft
    },
    discount: String,
    offerPrice: { type: String, default: "0" },
    inStockAvailable: { type: String },
    fullTitleDescription: [String],
    soldOutStock: { type: String },
    fullDescription: String,
    specifications: [SpecificationSchema],
    images: {
      type: [String],
      required: function () {
        return !this.isdraft;
      }, // Required only when not a draft
    },
    productthumbnailimage: {
      type: String,
      required: function () {
        return !this.isdraft;
      }, // Required only when not a draft
    },
    active: { type: Boolean, default: true },
    isdraft: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);
productSchema.index({ createdAt: -1, productId: 1 });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
