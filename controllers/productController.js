// controllers/productController.js
const Product = require("../models/product");
const cloudinary = require("cloudinary").v2;
const { v4: uuidv4 } = require("uuid");
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300 });

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const decodeFromUrl = (str) => {
  return decodeURIComponent(str)
    .replace(/-slash-/g, "/") // Replace "-slash-" back to "/"
    .replace(/-at-/g, "@") // Replace "-at-" back to "@"
    .replace(/-and-/g, "&") // Replace "-and-" back to "&"
    .replace(/-backslash-/g, "\\") // Replace "-backslash-" back to "\"
    .replace(/-percent-/g, "%"); // Replace "-percent-" back to "%"
};

// Generate productId
const generateProductId = async () => {
  // Retrieve all product IDs and sort them
  const products = await Product.find({}, { productId: 1, _id: 0 }).sort({
    productId: 1,
  });
  const productIds = products.map((product) =>
    parseInt(product.productId.replace("productid", ""), 10)
  );

  let productId = 1;
  for (let i = 0; i < productIds.length; i++) {
    if (productId < productIds[i]) {
      break;
    }
    productId++;
  }

  return `productid${String(productId).padStart(4, "0")}`;
};

// Helper function to upload images to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "matrixsol" },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

exports.createProduct = async (req, res) => {
  try {
    // For "Save as Draft", allow minimal fields
    const isDraft = req.body.isdraft === "true" || req.body.isdraft === true;

    // Minimal validation for drafts
    if (isDraft) {
      if (!req.body.modelNumber || !req.body.title || !req.body.brand) {
        return res.status(400).json({
          message:
            "Model Number, Title, and Brand are required for saving as draft.",
        });
      }
    } else {
      // Full validation for saving the product (non-draft)
      if (
        !req.files ||
        Object.keys(req.files).length === 0 ||
        !req.files.productthumbnailimage
      ) {
        return res.status(400).json({
          message: "Product thumbnail image is required.",
        });
      }

      if (
        !req.body.categoryName ||
        !req.body.modelNumber ||
        !req.body.title ||
        !req.body.brand ||
        !req.body.price ||
        !req.body.productthumbnailimage ||
        !req.body.images
      ) {
        return res.status(400).json({
          message:
            "Please provide all required fields (category, model number, title, brand, price).",
        });
      }
    }

    // Handle file uploads for non-draft products
    let productThumbnailImage = null;
    let imageUrls = [];

    if (!isDraft) {
      const thumbnailImageFile = req.files.productthumbnailimage;
      productThumbnailImage = await uploadToCloudinary(thumbnailImageFile.data);

      const files = req.files.images;
      const fileArray = Array.isArray(files) ? files : [files];
      for (const file of fileArray) {
        const imageUrl = await uploadToCloudinary(file.data);
        imageUrls.push(imageUrl);
      }
    }

    const productId = await generateProductId();

    const parsedSpecifications = req.body.specifications
      ? JSON.parse(req.body.specifications)
      : [];

    const parsedFullTitleDescription = req.body.fullTitleDescription
      ? req.body.fullTitleDescription.split(/\r?\n/)
      : [];

    const newProduct = new Product({
      productId,
      categoryName: req.body.categoryName || null, // Optional for drafts
      subCategoryName: req.body.subCategoryName,
      subSubCategoryName: req.body.subSubCategoryName,
      level3subCategoryName: req.body.level3subCategoryName,
      level4subCategoryName: req.body.level4subCategoryName,
      title: req.body.title,
      brand: req.body.brand,
      brandimage: req.body.brandimage,
      modelNumber: req.body.modelNumber,
      price: req.body.price || null, // Optional for drafts
      offerPrice: req.body.offerPrice || "0",
      discount: req.body.discount,
      inStockAvailable: req.body.inStockAvailable,
      fullTitleDescription: parsedFullTitleDescription,
      soldOutStock: req.body.soldOutStock,
      fullDescription: req.body.fullDescription,
      specifications: parsedSpecifications,
      images: imageUrls, // Only if not a draft
      productthumbnailimage: productThumbnailImage, // Only if not a draft
      active: req.body.active || false,
      isdraft: isDraft,
    });

    await newProduct.save();

    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allProducts") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(201).json({
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern.modelNumber) {
      return res.status(400).json({
        message:
          "This model number already exists. Please use a different model number.",
      });
    }

    console.error("Error creating product:", error.message);
    res.status(500).json({
      message: "Error creating product",
      error: error.message,
    });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const match = {}; // This will be used to filter the products

    // If 'active' filter is provided
    if (req.query.active) {
      match.active = req.query.active === "true";
    }

    if (req.query.isdraft) {
      match.isdraft = req.query.isdraft === "true";
    }
    // Category filtering (handles main category, subcategory, and subsubcategory)
    if (req.query.categoryName) {
      match.categoryName = decodeFromUrl(req.query.categoryName);
    }
    if (req.query.subCategoryName) {
      match.subCategoryName = decodeFromUrl(req.query.subCategoryName);
    }
    if (req.query.subSubCategoryName) {
      match.subSubCategoryName = decodeFromUrl(req.query.subSubCategoryName);
    }

    // Brand filtering
    if (req.query.brand) {
      match.brand = decodeFromUrl(req.query.brand);
    }

    // Construct cache key dynamically based on filters
    let cacheKey = `page:${page}-limit:${limit}`;
    if (req.query.categoryName) {
      cacheKey += `-categoryName:${req.query.categoryName}`;
    }
    if (req.query.subCategoryName) {
      cacheKey += `-subCategoryName:${req.query.subCategoryName}`;
    }
    if (req.query.subSubCategoryName) {
      cacheKey += `-subSubCategoryName:${req.query.subSubCategoryName}`;
    }
    if (req.query.brand) {
      cacheKey += `-brand:${req.query.brand}`;
    }
    if (req.query.isdraft) {
      cacheKey += `-isdraft:${req.query.isdraft}`;
    }
    if (req.query.active) {
      cacheKey += `-active:${req.query.active}`;
    }

    // Check cache first
    const cachedProducts = cache.get(cacheKey);
    if (cachedProducts) {
      return res.status(200).json(cachedProducts);
    }

    // Count total documents that match the filters
    const totalDocuments = await Product.countDocuments(match);

    // Fetch the filtered products with pagination
    const products = await Product.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalDocuments / limit);

    const result = {
      page,
      totalPages,
      totalDocuments,
      data: products,
    };

    // Store result in cache
    cache.set(cacheKey, result);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({
      message: "Error fetching products",
      error: error.message,
    });
  }
};

exports.toggleProductActiveState = async (req, res) => {
  try {
    const product = await Product.findOne({ productId: req.params.productId });
    if (!product) {
      return res.status(404).send("Product not found");
    }
    product.active = !product.active;
    if (!product.active) {
      product.inStockAvailable = 0;
      product.soldOutStock = 0;
    }

    await product.save();
    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allProducts") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));
    res.status(200).json(product);
  } catch (error) {
    console.error("Error toggling product active state:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Fetch product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ productId: req.params.productId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product by ID:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// controllers/productController.js

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const {
      categoryName,
      subCategoryName,
      title,
      subSubCategoryName,
      level3subCategoryName,
      level4subCategoryName,
      brand,
      brandimage,
      modelNumber,
      price,
      discount,
      offerPrice,
      fullDescription,
      fullTitleDescription,
      specifications,
      inStockAvailable,
      soldOutStock,
      removedImages,
      isdraft, // Add the `isdraft` field
    } = req.body;

    let imageUrls = [];
    let productThumbnailImage = null;

    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // If saving as a draft, allow minimal validation
    if (isdraft === "true" || isdraft === true) {
      if (!modelNumber || !title || !brand) {
        return res.status(400).json({
          message:
            "Model Number, Title, and Brand are required for draft updates.",
        });
      }

      // Ensure isdraft stays true (mark product as draft)
      product.isdraft = true;
      product.active = false;
    } else {
      // Full validation for publishing (non-draft)
      if (
        !categoryName ||
        !modelNumber ||
        !title ||
        !brand ||
        !price ||
        (!product.productthumbnailimage &&
          (!req.files || !req.files.productthumbnailimage)) || // Only check for new thumbnail if none exists
        (product.images.length === 0 && (!req.files || !req.files.images)) // Only check for new images if none exist
      ) {
        return res.status(400).json({
          message:
            "Please provide all required fields (category, model number, title, brand, price, product thumbnail image, and images) for publishing.",
        });
      }

      // Mark the product as published (isdraft = false)
      product.isdraft = false;
      product.active = true;

      // Handle file uploads for published products
      if (req.files && req.files.productthumbnailimage) {
        if (product.productthumbnailimage) {
          const publicId = product.productthumbnailimage
            .split("/")
            .slice(-1)[0]
            .split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        }
        const thumbnailImageFile = req.files.productthumbnailimage;
        productThumbnailImage = await uploadToCloudinary(
          thumbnailImageFile.data
        );
      }

      if (req.files && req.files.images) {
        const files = Array.isArray(req.files.images)
          ? req.files.images
          : [req.files.images];
        for (const file of files) {
          const imageUrl = await uploadToCloudinary(file.data);
          product.images.push(imageUrl);
        }
      }
    }

    imageUrls = product.images; // Assign updated image array to imageUrls
    productThumbnailImage =
      productThumbnailImage || product.productthumbnailimage; // Keep existing thumbnail if not updated

    // Handle the removal of existing images
    const removedImagesArray = JSON.parse(removedImages || "[]");
    if (removedImagesArray.length > 0) {
      for (const imageUrl of removedImagesArray) {
        const publicId = imageUrl.split("/").slice(-1)[0].split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }

      product.images = product.images.filter(
        (image) => !removedImagesArray.includes(image)
      );
    }

    // Parse specifications and full title description
    const parsedSpecifications = specifications
      ? JSON.parse(specifications)
      : [];

    const parsedFullTitleDescription = fullTitleDescription
      ? fullTitleDescription.split(/\r?\n/)
      : [];

    // Update product with new data
    const updatedProduct = await Product.findOneAndUpdate(
      { productId },
      {
        categoryName,
        subCategoryName,
        subSubCategoryName,
        level3subCategoryName,
        level4subCategoryName,
        title,
        brand,
        brandimage,
        modelNumber,
        price,
        offerPrice,
        discount,
        inStockAvailable,
        fullTitleDescription: parsedFullTitleDescription,
        soldOutStock,
        fullDescription,
        specifications: parsedSpecifications,
        images: imageUrls,
        productthumbnailimage: productThumbnailImage,
        isdraft: product.isdraft, // Will update isdraft based on the conditions above
        active: product.active,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    const cacheKeysToInvalidate = cache
      .keys()
      .filter(
        (key) =>
          key.includes("allProducts") ||
          key.includes("page:") ||
          key.includes(`productId:${productId}`) ||
          key.includes(`isdraft`) ||
          key.includes(`categoryName`) ||
          key.includes(`brand`)
      );
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res
      .status(200)
      .json({ message: "Product updated successfully", updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// delete function

exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Delete product from database
    const deletedProduct = await Product.findOneAndDelete({ productId });

    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete images from Cloudinary
    for (const imageUrl of deletedProduct.images) {
      const publicId = imageUrl.split("/").slice(-1)[0].split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }
    const cacheKeysToInvalidate = cache
      .keys()
      .filter((key) => key.includes("allProducts") || key.includes("page:"));
    cacheKeysToInvalidate.forEach((key) => cache.del(key));

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Fetch products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const decodedCategoryName = decodeFromUrl(
      decodeURIComponent(req.params.categoryName)
    );
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    // Create a unique cache key based on category and pagination
    let cacheKey = `category:${decodedCategoryName}-page:${page}-limit:${limit}`;
    const cachedProducts = cache.get(cacheKey);

    if (cachedProducts) {
      return res.status(200).json(cachedProducts);
    }

    const totalDocuments = await Product.countDocuments({
      categoryName: decodedCategoryName,
      isdraft: false,
    });

    const products = await Product.find({
      categoryName: decodedCategoryName,
      isdraft: false,
    })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalDocuments / limit);

    const result = {
      page,
      totalPages,
      totalDocuments,
      data: products,
    };

    // Cache the result
    cache.set(cacheKey, result);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching products by category:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Fetch products by category and subcategory
exports.getProductsBysubCategory = async (req, res) => {
  try {
    const decodedCategoryName = decodeFromUrl(
      decodeURIComponent(req.params.categoryName)
    );
    const decodedSubCategoryName = decodeFromUrl(
      decodeURIComponent(req.params.subCategoryName)
    );
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    // Create a unique cache key based on category, subcategory, and pagination
    let cacheKey = `category:${decodedCategoryName}-subcategory:${decodedSubCategoryName}-page:${page}-limit:${limit}`;
    const cachedProducts = cache.get(cacheKey);

    if (cachedProducts) {
      return res.status(200).json(cachedProducts);
    }

    const totalDocuments = await Product.countDocuments({
      categoryName: decodedCategoryName,
      subCategoryName: decodedSubCategoryName,
      isdraft: false,
    });

    const products = await Product.find({
      categoryName: decodedCategoryName,
      subCategoryName: decodedSubCategoryName,
      isdraft: false,
    })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalDocuments / limit);

    const result = {
      page,
      totalPages,
      totalDocuments,
      data: products,
    };

    // Cache the result
    cache.set(cacheKey, result);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching products by subcategory:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getProductsBysubsubCategory = async (req, res) => {
  try {
    const decodedCategoryName = decodeFromUrl(
      decodeURIComponent(req.params.categoryName)
    );
    const decodedSubCategoryName = decodeFromUrl(
      decodeURIComponent(req.params.subCategoryName)
    );
    const decodedSubSubCategoryName = decodeFromUrl(
      decodeURIComponent(req.params.subSubCategoryName)
    );
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    // Create a unique cache key based on category, subcategory, sub-subcategory, and pagination
    let cacheKey = `category:${decodedCategoryName}-subcategory:${decodedSubCategoryName}-subsubcategory:${decodedSubSubCategoryName}-page:${page}-limit:${limit}`;
    const cachedProducts = cache.get(cacheKey);

    if (cachedProducts) {
      return res.status(200).json(cachedProducts);
    }

    const totalDocuments = await Product.countDocuments({
      categoryName: decodedCategoryName,
      subCategoryName: decodedSubCategoryName,
      subSubCategoryName: decodedSubSubCategoryName,
      isdraft: false,
    });

    const products = await Product.find({
      categoryName: decodedCategoryName,
      subCategoryName: decodedSubCategoryName,
      subSubCategoryName: decodedSubSubCategoryName,
      isdraft: false,
    })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalDocuments / limit);

    const result = {
      page,
      totalPages,
      totalDocuments,
      data: products,
    };

    // Cache the result
    cache.set(cacheKey, result);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching products by sub-subcategory:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Fetch products by brand
exports.getProductsByBrand = async (req, res) => {
  try {
    const decodeBrand = decodeFromUrl(decodeURIComponent(req.params.brand));
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    // Create a unique cache key based on brand and pagination
    let cacheKey = `brand:${decodeBrand}-page:${page}-limit:${limit}`;
    const cachedProducts = cache.get(cacheKey);

    if (cachedProducts) {
      return res.status(200).json(cachedProducts);
    }

    const totalDocuments = await Product.countDocuments({
      brand: decodeBrand,
      isdraft: false,
    });

    const products = await Product.find({
      brand: decodeBrand,
      isdraft: false,
    })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalDocuments / limit);

    const result = {
      page,
      totalPages,
      totalDocuments,
      data: products,
    };

    // Cache the result
    cache.set(cacheKey, result);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching products by brand:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};
