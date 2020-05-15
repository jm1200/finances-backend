import { ICategoryRowSummary, CategoryRowSummary } from "./types";

export let initCategoryRows = (): ICategoryRowSummary => ({
  grandTotal: {
    categoryName: "Year over Year",
    categoryId: "Year over Year",
    subCategoryName: "Grand Total Cash Flow",
    years: {},
    subCategoryLength: 2,
    subCategories: {
      income: {
        subCategoryId: "Income",
        subCategoryName: "Income",
        years: {},
      },
      expenses: {
        subCategoryId: "Expenses",
        subCategoryName: "Expenses",
        years: {},
      },
    },
  },
});

export let newCategoryRow = (
  categoryId: string,
  categoryName: string
): CategoryRowSummary => ({
  categoryId,
  categoryName,
  subCategoryName: categoryName + " Totals",
  subCategoryLength: 2,
  years: {},
  subCategories: {
    income: {
      subCategoryId: "Income",
      subCategoryName: "Income",
      years: {},
    },
    expenses: {
      subCategoryId: "Expenses",
      subCategoryName: "Expenses",
      years: {},
    },
  },
});

// export let newSubCategoryRow = (
//   subCategoryId: string,
//   subCategoryName: string
// ): SubCategoryRow => ({
//   subCategoryId,
//   subCategoryName,
//   Jan: 0,
//   Feb: 0,
//   Mar: 0,
//   Apr: 0,
//   May: 0,
//   Jun: 0,
//   Jul: 0,
//   Aug: 0,
//   Sep: 0,
//   Oct: 0,
//   Nov: 0,
//   Dec: 0,
//   low: 0,
//   high: 0,
//   avg: 0,
//   med: 0,
// });
