import { createCategory } from "../utils/createCategoryEntity";
import { createSubCategory } from "../utils/createSubCategoryEntity";

export const createDefaultCategories = async (userId: string) => {
  defaultCategories.forEach(async (category) => {
    const categoryId = await createCategory(userId, category.name);
    if (categoryId) {
      category.subCategories.forEach(async (subCategory) => {
        createSubCategory(userId, subCategory, categoryId);
      });
    } else {
      console.log("error creating default categories");
    }
  });
};

export const defaultCategories = [
  {
    name: "Income",
    subCategories: ["Person A", "Business B", "Rental C"],
  },
  {
    name: "Rental Property A",
    subCategories: [
      "Electricity",
      "Gas",
      "Cable",
      "Property Taxes",
      "Mortgage",
    ],
  },
  {
    name: "Home",
    subCategories: [
      "Mortgage",
      "Property Taxes",
      "Cable",
      "Gas",
      "Electricity",
      "Water",
    ],
  },
  {
    name: "Food",
    subCategories: ["Fast food", "Restaurants", "Groceries"],
  },
  {
    name: "Kids",
    subCategories: ["Clothes", "School", "Entertainement", "Activities"],
  },
];
