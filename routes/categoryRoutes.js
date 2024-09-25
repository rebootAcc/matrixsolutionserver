// routes/categoryRoutes.js
const express = require("express");
const categoryController = require("../controllers/categoryController");

const router = express.Router();

router.post("/main", categoryController.createMainCategory);
router.post("/sub", categoryController.addSubCategory);
router.post("/subsub", categoryController.addSubSubCategory);
router.post("/lavel3", categoryController.addLavel3Category);
router.post("/lavel4", categoryController.addLavel4Category);
router.get("/getcategory", categoryController.getCategories);
router.put("/updatecategory", categoryController.updateCategory);
router.delete("/deletecategory", categoryController.deleteCategory);

module.exports = router;
