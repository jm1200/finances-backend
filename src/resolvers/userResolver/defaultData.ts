import { createCategory } from "../utils/createCategoryEntity";
import { createSubCategory } from "../utils/createSubCategoryEntity";

export const createDefaultCategories = async (userId: string) => {
  defaultCategories.forEach(async (category) => {
    const categoryId = await createCategory(userId, category.name);
    if (categoryId) {
      category.subCategories.forEach(async (subCategory) => {
        await createSubCategory(userId, subCategory, categoryId);
      });
    } else {
      console.log("error creating default categories");
    }
  });
};

export const defaultCategories = [
  {
    name: "uncategorized",
    subCategories: ["uncategorized"],
  },
  {
    name: "Income",
    subCategories: [
      "John",
      "Meghan",
      "Rental",
      "Credit Card Payment",
      "Government",
      "uncategorized",
    ],
  },
  {
    name: "Auto",
    subCategories: [
      "Maintenance",
      "Insurance",
      "Gas",
      "Parking",
      "407",
      "uncategorized",
    ],
  },
  {
    name: "Rental Property",
    subCategories: [
      "Mortgage",
      "Cleaning",
      "Property Taxes",
      "Cable",
      "Gas",
      "Electricity",
      "Water",
      "Insurance",
      "Maintenance",
      "uncategorized",
      "Credit Card Payment",
    ],
  },
  {
    name: "Home",
    subCategories: [
      "Mortgage",
      "Cleaning",
      "Property Taxes",
      "Cable",
      "Gas",
      "Electricity",
      "Water",
      "Insurance",
      "Pool/Hot tub",
      "Maintenance",
      "uncategorized",
      "Credit Card Payment",
    ],
  },
  {
    name: "Food",
    subCategories: ["Fast food", "Restaurants", "Groceries", "uncategorized"],
  },
  {
    name: "Kids",
    subCategories: [
      "Daycare",
      "Clothes",
      "School",
      "Entertainement",
      "Activities",
      "Health Care",
      "Transfer to RESP",
      "uncategorized",
    ],
  },
  {
    name: "Pets",
    subCategories: ["Food/Treats", "Vet bill", "Grooming", "uncategorized"],
  },
  {
    name: "Meghan",
    subCategories: [
      "Employement Expenses",
      "Healthcare",
      "Cell Phone",
      "Shopping",
      "Entertainement",
      "Transfer to Savings",
      "uncategorized",
    ],
  },
  {
    name: "John",
    subCategories: [
      "Employement Expenses",
      "Cell Phone",
      "Healthcare",
      "Shopping",
      "Entertainement",
      "Transfer to Savings",
      "uncategorized",
    ],
  },
  { name: "Shopping", subCategories: ["gifts", "uncategorized"] },
];
