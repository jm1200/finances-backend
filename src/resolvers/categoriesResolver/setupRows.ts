import { ICategoryRow, SubCategoryRow, CategoryRow } from "./types";

export let initCategoryRows = (): ICategoryRow => ({
  grandTotals: {
    categoryId: "cashFlow",
    categoryName: "Grand Totals",
    subCategoryName: "Cash Flow",
    subCategoryLength: 3,
    Jan: 0,
    Feb: 0,
    Mar: 0,
    Apr: 0,
    May: 0,
    Jun: 0,
    Jul: 0,
    Aug: 0,
    Sep: 0,
    Oct: 0,
    Nov: 0,
    Dec: 0,
    low: 0,
    high: 0,
    avg: 0,
    med: 0,
    subCategories: {
      income: {
        subCategoryId: "Income",
        subCategoryName: "Income",
        Jan: 0,
        Feb: 0,
        Mar: 0,
        Apr: 0,
        May: 0,
        Jun: 0,
        Jul: 0,
        Aug: 0,
        Sep: 0,
        Oct: 0,
        Nov: 0,
        Dec: 0,
        low: 0,
        high: 0,
        avg: 0,
        med: 0,
      },
      expenses: {
        subCategoryId: "Expenses",
        subCategoryName: "Expenses",
        Jan: 0,
        Feb: 0,
        Mar: 0,
        Apr: 0,
        May: 0,
        Jun: 0,
        Jul: 0,
        Aug: 0,
        Sep: 0,
        Oct: 0,
        Nov: 0,
        Dec: 0,
        low: 0,
        high: 0,
        avg: 0,
        med: 0,
      },
    },
  },
});
export let newCategoryRow = (
  categoryId: string,
  categoryName: string
): CategoryRow => ({
  categoryId,
  categoryName,
  subCategoryName: categoryName + " Totals",
  subCategoryLength: 0,
  Jan: 0,
  Feb: 0,
  Mar: 0,
  Apr: 0,
  May: 0,
  Jun: 0,
  Jul: 0,
  Aug: 0,
  Sep: 0,
  Oct: 0,
  Nov: 0,
  Dec: 0,
  low: 0,
  high: 0,
  avg: 0,
  med: 0,
  subCategories: {},
});
export let newSubCategoryRow = (
  subCategoryId: string,
  subCategoryName: string
): SubCategoryRow => ({
  subCategoryId,
  subCategoryName,
  Jan: 0,
  Feb: 0,
  Mar: 0,
  Apr: 0,
  May: 0,
  Jun: 0,
  Jul: 0,
  Aug: 0,
  Sep: 0,
  Oct: 0,
  Nov: 0,
  Dec: 0,
  low: 0,
  high: 0,
  avg: 0,
  med: 0,
});
