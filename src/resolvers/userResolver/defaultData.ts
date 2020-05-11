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
      "377 Hyde Park Rd.",
      "Credit Card Payment",
      "Government",
      "Interest",
      "uncategorized",
    ],
  },
  {
    name: "Travel",
    subCategories: [
      "Airline",
      "Hotel",
      "Rental Car",
      "Tax/Uber",
      "uncategorized",
    ],
  },
  {
    name: "Auto",
    subCategories: [
      "Maintenance",
      "Insurance",
      "Gas",
      "Licensing",
      "Parking",
      "407",
      "uncategorized",
    ],
  },
  {
    name: "Family",
    subCategories: [
      "Shopping",
      "Essentials",
      "Clothes",
      "Entertainment",
      "Healthcare",
      "uncategorized",
    ],
  },
  {
    name: "Money Transfers",
    subCategories: [
      "Creditcard Payments",
      "Pension Payments",
      "RESP transfers",
      "John RRSP transfer",
      "Meghan RRSP transfer",
      "Donations",
      "Banking Charges",
      "Transfer to Savings",
      "Taxes",
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
    subCategories: [
      "Fast food",
      "Restaurants",
      "Groceries",
      "Booze",
      "Treats",
      "uncategorized",
    ],
  },
  {
    name: "Kids",
    subCategories: [
      "Daycare",
      "Clothes",
      "School",
      "Entertainement",
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
      "Cell Phone",
      "Transfer to Savings",
      "uncategorized",
    ],
  },
  {
    name: "John",
    subCategories: [
      "Employement Expenses",
      "Away Food",
      "Cell Phone",
      "Transfer to Savings",
      "uncategorized",
    ],
  },
  {
    name: "Shopping",
    subCategories: ["Gifts", "Online", "Meghan", "John", "uncategorized"],
  },
  {
    name: "Entertainement",
    subCategories: ["Kids", "Family", "Meghan", "John", "uncategorized"],
  },
  {
    name: "Healthcare",
    subCategories: ["Kids", "Family", "Meghan", "John", "uncategorized"],
  },
  { name: "zzIgnore", subCategories: ["uncategorized"] },
];
