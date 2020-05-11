import { CategoryEntity } from "../../entity/Category";
import { SubCategoryEntity } from "../../entity/SubCategory";

interface IKnownCategory {
  name: string;
  categoryName: string;
  subCategoryName: string;
}

const KNOWN_CATEGORIES: IKnownCategory[] = [
  { name: "mcdonald's", categoryName: "Food", subCategoryName: "Fast food" },
  { name: "starbucks", categoryName: "Food", subCategoryName: "Fast food" },
  { name: "a&w", categoryName: "Food", subCategoryName: "Fast food" },
  { name: "tim hortons", categoryName: "Food", subCategoryName: "Fast food" },
  { name: "burger king", categoryName: "Food", subCategoryName: "Fast food" },
  { name: "impark", categoryName: "Auto", subCategoryName: "Parking" },
  { name: "parking", categoryName: "Auto", subCategoryName: "Parking" },
  {
    name: "five guys burgers",
    categoryName: "Food",
    subCategoryName: "Fast food",
  },
  { name: "amazon.ca", categoryName: "Shopping", subCategoryName: "Online" },
  { name: "amzn", categoryName: "Shopping", subCategoryName: "Online" },
  { name: "foodland", categoryName: "Food", subCategoryName: "Groceries" },
  { name: "metro", categoryName: "Food", subCategoryName: "Groceries" },
  { name: "rcss", categoryName: "Food", subCategoryName: "Groceries" },
  { name: "remark", categoryName: "Food", subCategoryName: "Groceries" },
  { name: "mobil", categoryName: "Auto", subCategoryName: "Gas" },
  { name: "esso", categoryName: "Auto", subCategoryName: "Gas" },
  { name: "petrocan", categoryName: "Auto", subCategoryName: "Gas" },
  { name: "onroute", categoryName: "Auto", subCategoryName: "Gas" },
  { name: "homesense", categoryName: "Meghan", subCategoryName: "Shopping" },
  {
    name: "shoppers drug mart",
    categoryName: "Family",
    subCategoryName: "Essentials",
  },
  { name: "lcbo", categoryName: "Food", subCategoryName: "Booze" },
  {
    name: "pioneer pools",
    categoryName: "Home",
    subCategoryName: "Pool/Hot tub",
  },
  {
    name: "payment / paiement - cibc",
    categoryName: "Money Transfers",
    subCategoryName: "Creditcard Payments",
  },
  {
    name: "d'lux auto spa",
    categoryName: "Auto",
    subCategoryName: "Maintenance",
  },
  { name: "tvdsb", categoryName: "Income", subCategoryName: "Meghan" },
  { name: "air canada", categoryName: "Income", subCategoryName: "John" },
  {
    name: "mastercard, pc financial",
    categoryName: "Money Transfers",
    subCategoryName: "Creditcard Payments",
  },
];

export const getNormalizedCategories = async () => {
  interface ICategoriesMap {
    [key: string]: {
      id: string;
      name: string;
      subCategories: ISubCategoriesMap;
    };
  }
  interface ISubCategoriesMap {
    [key: string]: SubCategoryEntity;
  }

  let categories = await CategoryEntity.find({ relations: ["subCategories"] });
  let normalizedCategories: ICategoriesMap = {};
  categories.forEach((category) => {
    let normalizedSubCategories: ISubCategoriesMap = {};
    category.subCategories.forEach((subCategory) => {
      normalizedSubCategories[subCategory.name] = subCategory;
    });
    normalizedCategories[category.name] = {
      id: category.id,
      name: category.name,
      subCategories: normalizedSubCategories,
    };
  });

  return normalizedCategories;
};

export const getKnownCategories = async () => {
  let normalizedCategories = await getNormalizedCategories();

  interface IKnownCategoryMap {
    [key: string]: { categoryId: string; subCategoryId: string };
  }
  let KNOWN_CATEGORIES_MAP: IKnownCategoryMap = {};
  KNOWN_CATEGORIES.forEach((knownCategory) => {
    KNOWN_CATEGORIES_MAP[knownCategory.name] = {
      categoryId: normalizedCategories[knownCategory.categoryName].id,
      subCategoryId:
        normalizedCategories[knownCategory.categoryName].subCategories[
          knownCategory.subCategoryName
        ].id,
    };
  });

  return KNOWN_CATEGORIES_MAP;
};
