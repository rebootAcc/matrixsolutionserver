// routes/productRoutes.js
const express = require("express");
const productController = require("../controllers/productController");

const router = express.Router();

router.post("/add", productController.createProduct);
router.get("/all", productController.getAllProducts);
router.put(
  "/toggle-active/:productId",
  productController.toggleProductActiveState
);

router.get("/:productId", productController.getProductById);
router.get("/category/:categoryName", productController.getProductsByCategory);
router.get("/brand/:brand", productController.getProductsByBrand);

router.get(
  "/category/:categoryName/subcategory/:subCategoryName",
  productController.getProductsBysubCategory
);
router.get(
  "/category/:categoryName/subcategory/:subCategoryName/subsubcategory/:subSubCategoryName",
  productController.getProductsBysubsubCategory
);

router.put("/update/:productId", productController.updateProduct);
router.delete("/delete/:productId", productController.deleteProduct);
module.exports = router;
