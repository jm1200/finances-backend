import moment from "moment";
var util = require("util");
import fs from "fs";
import numeral from "numeral";
import { SubCategoryEntity } from "../../entity/SubCategory";
//import { CategoryTotalsEntity } from "../../entity/CategoryTotals";
import {
  ICategoryRow,
  IDisplayData,
  IDisplaySubCategoryRow,
  Month,
  SubCategoryRow,
} from "./types";
import {
  initCategoryRows,
  newSubCategoryRow,
  newCategoryRow,
} from "./setupRows";

export const parseTransactionsForCashFlowAnalysis = (
  subCategories: SubCategoryEntity[],
  selectedYear: number,
  filteredCategory: string
) => {
  console.log("PTFC 25 running with: ", filteredCategory, selectedYear);
  // CREATE GRAND TOTAL ROWS for the top of each Book section
  let categoryRows: ICategoryRow = initCategoryRows();
  let testObj: any = [];
  subCategories
    .filter((subCategory) => subCategory.category.name !== "zzIgnore")
    .forEach((subCategory) => {
      //there are default categories, some sub categories may not have any transactions
      //because the user has not needed them. So only display subcategories that have values
      if (subCategory.transactions.length > 0) {
        //For each subcategory, filter through the transactions and select for the book and the year.
        let newSubCatRow = newSubCategoryRow(subCategory.id, subCategory.name);
        subCategory.transactions.forEach((transaction) => {
          const test =
            transaction.book === filteredCategory &&
            transaction.datePosted.slice(0, 4) === selectedYear.toString();
          if (test) {
            if (!Object.keys(categoryRows).includes(subCategory.category.id)) {
              categoryRows[subCategory.category.id] = newCategoryRow(
                subCategory.category.id,
                subCategory.category.name
              );
            }
            if (
              !Object.keys(
                categoryRows[subCategory.category.id].subCategories
              ).includes(subCategory.id)
            ) {
              categoryRows[subCategory.category.id].subCategories[
                subCategory.id
              ] = newSubCategoryRow(subCategory.id, subCategory.name);
            }

            let month: Month = moment(
              transaction.datePosted,
              "YYYYMMDD"
            ).format("MMM") as Month;

            //update subcategory row
            categoryRows[subCategory.category.id].subCategories[subCategory.id][
              month
            ] += transaction.amount;

            //update category row
            categoryRows[subCategory.category.id][month] += transaction.amount;

            //update grand totals
            categoryRows["grandTotals"][month] += transaction.amount;
            if (transaction.amount < 0) {
              categoryRows["grandTotals"].subCategories["expenses"][month] +=
                transaction.amount;
            } else {
              categoryRows["grandTotals"].subCategories["income"][month] +=
                transaction.amount;
            }
          }
        });
      }
    });

  //console.log("PTFC89, ", categoryRows);
  const getAverages = (array: number[]) => {
    let filteredArray = array
      .filter((num) => num !== 0)
      .map((x) => Math.abs(x));
    let low,
      high,
      avg,
      med = 0;
    if (filteredArray && filteredArray.length > 0) {
      low = Math.min(...filteredArray);
      high = Math.max(...filteredArray);
      let sum = filteredArray.reduce(
        (previous, current) => (current += previous)
      );
      avg = sum / filteredArray.length;

      filteredArray.sort((a, b) => a - b);
      med =
        (filteredArray[(filteredArray.length - 1) >> 1] +
          filteredArray[filteredArray.length >> 1]) /
        2;
    }

    return { low, high, avg, med };
  };

  let categoryRowsArray = Object.keys(categoryRows).map((categoryKey) => {
    return Object.assign(
      {},
      { ...categoryRows[categoryKey] },
      {
        subCategories: Object.keys(categoryRows[categoryKey].subCategories).map(
          (subCategoryKey) =>
            categoryRows[categoryKey].subCategories[subCategoryKey]
        ),
      }
    );
  });

  categoryRowsArray.forEach((category) => {
    let catMonthValues: number[] = [
      category.Jan,
      category.Feb,
      category.Mar,
      category.Apr,
      category.May,
      category.Jun,
      category.Jul,
      category.Aug,
      category.Sep,
      category.Oct,
      category.Nov,
      category.Dec,
    ];
    const { low, high, avg, med } = getAverages(catMonthValues);
    category.low = low;
    category.high = high;
    category.avg = avg;
    category.med = med;
    category.subCategoryLength = category.subCategories.length;
    category.subCategories.forEach((subCategory) => {
      let monthValues: number[] = [
        subCategory.Jan,
        subCategory.Feb,
        subCategory.Mar,
        subCategory.Apr,
        subCategory.May,
        subCategory.Jun,
        subCategory.Jul,
        subCategory.Aug,
        subCategory.Sep,
        subCategory.Oct,
        subCategory.Nov,
        subCategory.Dec,
      ];
      const { low, high, avg, med } = getAverages(monthValues);
      subCategory.low = low;
      subCategory.high = high;
      subCategory.avg = avg;
      subCategory.med = med;
    });
  });

  let displayData: IDisplayData[] = [];

  categoryRowsArray.forEach((category) => {
    let displayCategory: IDisplayData = {
      categoryName: category.categoryName,
      subCategoryName: category.subCategoryName,
      categoryId: category.categoryId,
      subCategoryLength: category.subCategoryLength,
      Jan: numeral(category.Jan).format("$0,0.00"),
      Feb: numeral(category.Feb).format("$0,0.00"),
      Mar: numeral(category.Mar).format("$0,0.00"),
      Apr: numeral(category.Apr).format("$0,0.00"),
      May: numeral(category.May).format("$0,0.00"),
      Jun: numeral(category.Jun).format("$0,0.00"),
      Jul: numeral(category.Jul).format("$0,0.00"),
      Aug: numeral(category.Aug).format("$0,0.00"),
      Sep: numeral(category.Sep).format("$0,0.00"),
      Oct: numeral(category.Oct).format("$0,0.00"),
      Nov: numeral(category.Nov).format("$0,0.00"),
      Dec: numeral(category.Dec).format("$0,0.00"),
      low: numeral(category.low).format("$0,0.00"),
      high: numeral(category.high).format("$0,0.00"),
      avg: numeral(category.avg).format("$0,0.00"),
      med: numeral(category.med).format("$0,0.00"),
      subCategories: [],
    };
    category.subCategories.forEach((subCategory) => {
      let displaySubCategory: IDisplaySubCategoryRow = {
        subCategoryName: subCategory.subCategoryName,
        subCategoryId: subCategory.subCategoryId,
        Jan: numeral(subCategory.Jan).format("$0,0.00"),
        Feb: numeral(subCategory.Feb).format("$0,0.00"),
        Mar: numeral(subCategory.Mar).format("$0,0.00"),
        Apr: numeral(subCategory.Apr).format("$0,0.00"),
        May: numeral(subCategory.May).format("$0,0.00"),
        Jun: numeral(subCategory.Jun).format("$0,0.00"),
        Jul: numeral(subCategory.Jul).format("$0,0.00"),
        Aug: numeral(subCategory.Aug).format("$0,0.00"),
        Sep: numeral(subCategory.Sep).format("$0,0.00"),
        Oct: numeral(subCategory.Oct).format("$0,0.00"),
        Nov: numeral(subCategory.Nov).format("$0,0.00"),
        Dec: numeral(subCategory.Dec).format("$0,0.00"),
        low: numeral(subCategory.low).format("$0,0.00"),
        high: numeral(subCategory.high).format("$0,0.00"),
        avg: numeral(subCategory.avg).format("$0,0.00"),
        med: numeral(subCategory.med).format("$0,0.00"),
      };
      displayCategory.subCategories.push(displaySubCategory);
    });
    displayData.push(displayCategory);
  });

  // fs.writeFileSync(
  //   "./test.txt",
  //   util.inspect(categoryRows, { showHidden: true, depth: null })
  // );

  return displayData;
};
