const Category = require("../models/category");

const generateCategoryId = async () => {
  const count = await Category.countDocuments();
  return `category${String(count + 1).padStart(4, "0")}`;
};

exports.createMainCategory = async (req, res) => {
  try {
    const { mainCategory } = req.body;

    const categoryId = await generateCategoryId();
    const newCategory = new Category({
      categoryId,
      mainCategory,
      subcategories: [],
    });

    await newCategory.save();
    res
      .status(201)
      .json({ message: "Main category created successfully", newCategory });
  } catch (error) {
    console.error("Error creating main category:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.addSubCategory = async (req, res) => {
  try {
    const { mainCategory, subCategoryName } = req.body;

    const category = await Category.findOne({ mainCategory });
    if (!category) {
      return res.status(404).json({ message: "Main category not found" });
    }

    category.subcategories.push({
      name: subCategoryName,
      subsubcategories: [],
    });
    await category.save();
    res
      .status(201)
      .json({ message: "Subcategory added successfully", category });
  } catch (error) {
    console.error("Error adding subcategory:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.addSubSubCategory = async (req, res) => {
  try {
    const { mainCategory, subCategoryName, subSubCategoryName } = req.body;

    const category = await Category.findOne({ mainCategory });
    if (!category) {
      return res.status(404).json({ message: "Main category not found" });
    }

    const subCategory = category.subcategories.find(
      (sub) => sub.name === subCategoryName
    );
    if (!subCategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    subCategory.subsubcategories.push({ name: subSubCategoryName });
    await category.save();
    res
      .status(201)
      .json({ message: "Subsubcategory added successfully", category });
  } catch (error) {
    console.error("Error adding subsubcategory:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.addLavel3Category = async (req, res) => {
  try {
    const {
      mainCategory,
      subCategoryName,
      subSubCategoryName,
      lavel3CategoryName,
    } = req.body;

    const category = await Category.findOne({ mainCategory });
    if (!category) {
      return res.status(404).json({ message: "Main category not found" });
    }

    const subCategory = category.subcategories.find(
      (sub) => sub.name === subCategoryName
    );
    if (!subCategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    const subSubCategory = subCategory.subsubcategories.find(
      (subSub) => subSub.name === subSubCategoryName
    );
    if (!subSubCategory) {
      return res.status(404).json({ message: "Subsubcategory not found" });
    }

    subSubCategory.lavel3CategorySchema.push({ name: lavel3CategoryName });
    await category.save();
    res.status(201).json({
      message: "3rd level category added successfully",
      category,
    });
  } catch (error) {
    console.error("Error adding 3rd level category:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Adding 4th level subcategory
exports.addLavel4Category = async (req, res) => {
  try {
    const {
      mainCategory,
      subCategoryName,
      subSubCategoryName,
      lavel3CategoryName,
      lavel4CategoryName,
    } = req.body;

    const category = await Category.findOne({ mainCategory });
    if (!category) {
      return res.status(404).json({ message: "Main category not found" });
    }

    const subCategory = category.subcategories.find(
      (sub) => sub.name === subCategoryName
    );
    if (!subCategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    const subSubCategory = subCategory.subsubcategories.find(
      (subSub) => subSub.name === subSubCategoryName
    );
    if (!subSubCategory) {
      return res.status(404).json({ message: "Subsubcategory not found" });
    }

    const lavel3Category = subSubCategory.lavel3CategorySchema.find(
      (lavel3) => lavel3.name === lavel3CategoryName
    );
    if (!lavel3Category) {
      return res.status(404).json({ message: "3rd level category not found" });
    }

    lavel3Category.lavel4CategorySchema.push({ name: lavel4CategoryName });
    await category.save();
    res.status(201).json({
      message: "4th level category added successfully",
      category,
    });
  } catch (error) {
    console.error("Error adding 4th level category:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const {
      mainCategory,
      newMainCategory,
      subCategoryName,
      newSubCategoryName,
      subSubCategoryName,
      newSubSubCategoryName,
      lavel3CategoryName,
      newLavel3CategoryName,
      lavel4CategoryName,
      newLavel4CategoryName,
    } = req.body;

    const category = await Category.findOne({ mainCategory });
    if (!category) {
      return res.status(404).json({ message: "Main category not found" });
    }

    if (newMainCategory) {
      category.mainCategory = newMainCategory;
    }

    if (subCategoryName && newSubCategoryName) {
      const subCategory = category.subcategories.find(
        (sub) => sub.name === subCategoryName
      );
      if (!subCategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      subCategory.name = newSubCategoryName;
    }

    if (subSubCategoryName && newSubSubCategoryName) {
      const subCategory = category.subcategories.find(
        (sub) => sub.name === subCategoryName
      );
      if (!subCategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      const subSubCategory = subCategory.subsubcategories.find(
        (subSub) => subSub.name === subSubCategoryName
      );
      if (!subSubCategory) {
        return res.status(404).json({ message: "Subsubcategory not found" });
      }
      subSubCategory.name = newSubSubCategoryName;
    }

    if (lavel3CategoryName && newLavel3CategoryName) {
      const subCategory = category.subcategories.find(
        (sub) => sub.name === subCategoryName
      );
      if (!subCategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      const subSubCategory = subCategory.subsubcategories.find(
        (subSub) => subSub.name === subSubCategoryName
      );
      if (!subSubCategory) {
        return res.status(404).json({ message: "Subsubcategory not found" });
      }
      const lavel3Category = subSubCategory.lavel3CategorySchema.find(
        (lavel3) => lavel3.name === lavel3CategoryName
      );
      if (!lavel3Category) {
        return res
          .status(404)
          .json({ message: "3rd level category not found" });
      }
      lavel3Category.name = newLavel3CategoryName;
    }

    if (lavel4CategoryName && newLavel4CategoryName) {
      const subCategory = category.subcategories.find(
        (sub) => sub.name === subCategoryName
      );
      if (!subCategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      const subSubCategory = subCategory.subsubcategories.find(
        (subSub) => subSub.name === subSubCategoryName
      );
      if (!subSubCategory) {
        return res.status(404).json({ message: "Subsubcategory not found" });
      }
      const lavel3Category = subSubCategory.lavel3CategorySchema.find(
        (lavel3) => lavel3.name === lavel3CategoryName
      );
      if (!lavel3Category) {
        return res
          .status(404)
          .json({ message: "3rd level category not found" });
      }
      const lavel4Category = lavel3Category.lavel4CategorySchema.find(
        (lavel4) => lavel4.name === lavel4CategoryName
      );
      if (!lavel4Category) {
        return res
          .status(404)
          .json({ message: "4th level category not found" });
      }
      lavel4Category.name = newLavel4CategoryName;
    }

    await category.save();
    res.status(200).json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Error updating category:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const {
      mainCategory,
      subCategoryName,
      subSubCategoryName,
      lavel3CategoryName,
      lavel4CategoryName,
    } = req.body;

    if (
      mainCategory &&
      !subCategoryName &&
      !subSubCategoryName &&
      !lavel3CategoryName &&
      !lavel4CategoryName
    ) {
      await Category.deleteOne({ mainCategory });
      return res
        .status(200)
        .json({ message: "Main category deleted successfully" });
    }

    const category = await Category.findOne({ mainCategory });
    if (!category) {
      return res.status(404).json({ message: "Main category not found" });
    }

    if (
      subCategoryName &&
      !subSubCategoryName &&
      !lavel3CategoryName &&
      !lavel4CategoryName
    ) {
      const subCategoryIndex = category.subcategories.findIndex(
        (sub) => sub.name === subCategoryName
      );
      if (subCategoryIndex === -1) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      category.subcategories.splice(subCategoryIndex, 1);
      await category.save();
      return res.status(200).json({
        message: "Subcategory deleted successfully",
        category,
      });
    }

    if (
      subCategoryName &&
      subSubCategoryName &&
      !lavel3CategoryName &&
      !lavel4CategoryName
    ) {
      const subCategory = category.subcategories.find(
        (sub) => sub.name === subCategoryName
      );
      if (!subCategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      const subSubCategoryIndex = subCategory.subsubcategories.findIndex(
        (subSub) => subSub.name === subSubCategoryName
      );
      if (subSubCategoryIndex === -1) {
        return res.status(404).json({ message: "Subsubcategory not found" });
      }
      subCategory.subsubcategories.splice(subSubCategoryIndex, 1);
      await category.save();
      return res.status(200).json({
        message: "Subsubcategory deleted successfully",
        category,
      });
    }

    if (
      subCategoryName &&
      subSubCategoryName &&
      lavel3CategoryName &&
      !lavel4CategoryName
    ) {
      const subCategory = category.subcategories.find(
        (sub) => sub.name === subCategoryName
      );
      if (!subCategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      const subSubCategory = subCategory.subsubcategories.find(
        (subSub) => subSub.name === subSubCategoryName
      );
      if (!subSubCategory) {
        return res.status(404).json({ message: "Subsubcategory not found" });
      }
      const lavel3CategoryIndex = subSubCategory.lavel3CategorySchema.findIndex(
        (lavel3) => lavel3.name === lavel3CategoryName
      );
      if (lavel3CategoryIndex === -1) {
        return res
          .status(404)
          .json({ message: "3rd level category not found" });
      }
      subSubCategory.lavel3CategorySchema.splice(lavel3CategoryIndex, 1);
      await category.save();
      return res.status(200).json({
        message: "3rd level category deleted successfully",
        category,
      });
    }

    if (
      subCategoryName &&
      subSubCategoryName &&
      lavel3CategoryName &&
      lavel4CategoryName
    ) {
      const subCategory = category.subcategories.find(
        (sub) => sub.name === subCategoryName
      );
      if (!subCategory) {
        return res.status(404).json({ message: "Subcategory not found" });
      }
      const subSubCategory = subCategory.subsubcategories.find(
        (subSub) => subSub.name === subSubCategoryName
      );
      if (!subSubCategory) {
        return res.status(404).json({ message: "Subsubcategory not found" });
      }
      const lavel3Category = subSubCategory.lavel3CategorySchema.find(
        (lavel3) => lavel3.name === lavel3CategoryName
      );
      if (!lavel3Category) {
        return res
          .status(404)
          .json({ message: "3rd level category not found" });
      }
      const lavel4CategoryIndex = lavel3Category.lavel4CategorySchema.findIndex(
        (lavel4) => lavel4.name === lavel4CategoryName
      );
      if (lavel4CategoryIndex === -1) {
        return res
          .status(404)
          .json({ message: "4th level category not found" });
      }
      lavel3Category.lavel4CategorySchema.splice(lavel4CategoryIndex, 1);
      await category.save();
      return res.status(200).json({
        message: "4th level category deleted successfully",
        category,
      });
    }

    res.status(400).json({ message: "Invalid delete request" });
  } catch (error) {
    console.error("Error deleting category:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};
