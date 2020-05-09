import moment from "moment";
//var util = require("util");
//import fs from "fs";
import numeral from "numeral";
import { SubCategoryEntity } from "../../entity/SubCategory";
import { CategoryTotalsEntity } from "../../entity/CategoryTotals";
import { ObjectType, Field } from "type-graphql";

type Month =
  | "Jan"
  | "Feb"
  | "Mar"
  | "Apr"
  | "May"
  | "Jun"
  | "Jul"
  | "Aug"
  | "Sep"
  | "Oct"
  | "Nov"
  | "Dec";

interface SubCategoryRow {
  subCategoryName: string;
  subCategoryId: string;
  Jan: number;
  Feb: number;
  Mar: number;
  Apr: number;
  May: number;
  Jun: number;
  Jul: number;
  Aug: number;
  Sep: number;
  Oct: number;
  Nov: number;
  Dec: number;
  low?: number;
  high?: number;
  avg?: number;
  med?: number;
}

@ObjectType()
class IDisplaySubCategoryRow {
  @Field()
  subCategoryName: string;
  @Field()
  subCategoryId: string;
  @Field()
  Jan: string;
  @Field()
  Feb: string;
  @Field()
  Mar: string;
  @Field()
  Apr: string;
  @Field()
  May: string;
  @Field()
  Jun: string;
  @Field()
  Jul: string;
  @Field()
  Aug: string;
  @Field()
  Sep: string;
  @Field()
  Oct: string;
  @Field()
  Nov: string;
  @Field()
  Dec: string;
  @Field()
  low?: string;
  @Field()
  high?: string;
  @Field()
  avg?: string;
  @Field()
  med?: string;
}

@ObjectType()
export class IDisplayData {
  @Field()
  categoryName: string;
  @Field()
  subCategoryName: string;
  @Field()
  categoryId: string;
  @Field()
  subCategoryLength: number;
  @Field()
  Jan: string;
  @Field()
  Feb: string;
  @Field()
  Mar: string;
  @Field()
  Apr: string;
  @Field()
  May: string;
  @Field()
  Jun: string;
  @Field()
  Jul: string;
  @Field()
  Aug: string;
  @Field()
  Sep: string;
  @Field()
  Oct: string;
  @Field()
  Nov: string;
  @Field()
  Dec: string;
  @Field()
  low?: string;
  @Field()
  high?: string;
  @Field()
  avg?: string;
  @Field()
  med?: string;
  @Field(() => [IDisplaySubCategoryRow])
  subCategories: IDisplaySubCategoryRow[];
}

interface ISubCategoryRow {
  [key: string]: SubCategoryRow;
}

interface ICategoryRow {
  [key: string]: {
    categoryName: string;
    subCategoryName: string;
    categoryId: string;
    subCategoryLength: number;
    Jan: number;
    Feb: number;
    Mar: number;
    Apr: number;
    May: number;
    Jun: number;
    Jul: number;
    Aug: number;
    Sep: number;
    Oct: number;
    Nov: number;
    Dec: number;
    low?: number;
    high?: number;
    avg?: number;
    med?: number;
    subCategories: ISubCategoryRow;
  };
}

export const parseTransactionsForCashFlowAnalysis = (
  subCategories: SubCategoryEntity[],
  selectedYear: number
) => {
  let categoryRows: ICategoryRow = {};
  console.log("PTFC164 running");
  subCategories.forEach((subCategory) => {
    if (Object.keys(categoryRows).includes(subCategory.category.id)) {
      //Sub category will not exist because each is subCategory is unique to each category.
      //create new sub category row for existing category row.
      let newSubCategoryRow = {
        subCategoryId: subCategory.id,
        subCategoryName: subCategory.name,
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
      };
      if (subCategory.transactions.length > 0) {
        let filteredTransactions = subCategory.transactions.filter(
          (transaction) =>
            transaction.datePosted.slice(0, 4) === selectedYear.toString()
        );
        if (filteredTransactions.length > 0) {
          filteredTransactions.forEach((transaction) => {
            let month: Month = moment(
              transaction.datePosted,
              "YYYYMMDD"
            ).format("MMM") as Month;
            newSubCategoryRow[month] += Math.abs(transaction.amount);
            categoryRows[subCategory.category.id][month] += Math.abs(
              transaction.amount
            );
          });
        }

        categoryRows[subCategory.category.id].subCategories[
          subCategory.id
        ] = newSubCategoryRow;
      }
    } else {
      //create the first subCategory row
      let newSubCategoryRow: ISubCategoryRow = {};
      newSubCategoryRow[subCategory.id] = {
        subCategoryId: subCategory.id,
        subCategoryName: subCategory.name,
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
      };
      //Category Row does not exist. Create new one.

      categoryRows[subCategory.category.id] = {
        categoryId: subCategory.category.id,
        categoryName: subCategory.category.name,
        subCategoryName: subCategory.category.name + " Totals",
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
      };
      //fill them with transaction amounts
      if (subCategory.transactions.length > 0) {
        let filteredTransactions = subCategory.transactions.filter(
          (transaction) => {
            return (
              transaction.datePosted.slice(0, 4) === selectedYear.toString()
            );
          }
        );
        if (filteredTransactions.length > 0) {
          filteredTransactions.forEach((transaction) => {
            let month: Month = moment(
              transaction.datePosted,
              "YYYYMMDD"
            ).format("MMM") as Month;
            newSubCategoryRow[subCategory.id][month] += Math.abs(
              transaction.amount
            );
            categoryRows[subCategory.category.id][month] += Math.abs(
              transaction.amount
            );
          });
        }

        categoryRows[subCategory.category.id].subCategories = newSubCategoryRow;
      }
    }
  });

  //console.log("PTFC180, ", categoryRows);
  const getAverages = (array: number[]) => {
    let filteredArray = array.filter((num) => num !== 0);
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
    let monthValues: number[] = [
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
    const { low, high, avg, med } = getAverages(monthValues);
    category.low = low;
    category.high = high;
    category.avg = avg;
    category.med = med;
    category.subCategoryLength = category.subCategories.length;

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
      category.subCategories.forEach((subCategory) => {
        let monthValues: number[] = [
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
  //   util.inspect(displayData, { showHidden: true, depth: null })
  // );
  return displayData;
};
