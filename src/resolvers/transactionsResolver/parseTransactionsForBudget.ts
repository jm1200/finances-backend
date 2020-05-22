var util = require("util");
import fs from "fs";
import { TransactionEntity } from "../../entity/Transaction";
import { Field, ObjectType, Float } from "type-graphql";
import numeral from "numeral";
import moment from "moment";

interface BudgetSubCategoryRow {
  currentMonthAmounts: number[];
  lastYearCurrentMonthAmounts: number[];
  lastMonthAmounts: number[];
  lastYearLastMonthAmounts: number[];
  inputValue: number;
  subCategoryId: string;
  subCategoryName: string;
  allAmounts: number[];
}
interface IBudgetSubCategoryRow {
  [key: string]: BudgetSubCategoryRow;
}
interface BudgetCategoryRow {
  categoryId: string;
  categoryName: string;
  subCategoryLength: number;
  subCategories: {
    [key: string]: BudgetSubCategoryRow;
  };
}
@ObjectType()
class DisplaySubCategoryRow {
  @Field()
  subCategoryId: string;
  @Field()
  subCategoryName: string;
  @Field()
  inputValue: number;
  @Field(() => Float)
  avg: number;
  @Field(() => Float)
  currentMonth: number;
  @Field(() => Float)
  lastMonth: number;
  @Field(() => Float)
  lastYearCurrentMonth: number;
  @Field(() => Float)
  lastYearLastMonth: number;
}

@ObjectType()
export class ArrayedBudgetCategoryRow {
  @Field()
  categoryId: string;
  @Field()
  categoryName: string;
  @Field()
  subCategoryLength: number;
  @Field(() => [DisplaySubCategoryRow])
  subCategories: DisplaySubCategoryRow[];
}
interface IBudgetCategoryRow {
  [key: string]: BudgetCategoryRow;
}

interface DatesObj {
  currentMonth: string;
  lastMonth: string;
  currentYear: number;
  lastYear: number;
}

// interface DisplayData {
//   categoryId: string;
//   categoryName: string;
//   subCategoryLength: number;
//   subCategories: DisplaySubCategoryRow[];
// }

function dateSortAmounts(
  datePosted: string,
  allAmounts: number[],
  currentMonthAmounts: number[],
  lastMonthAmounts: number[],
  lastYearCurrentMonthAmounts: number[],
  lastYearLastMonthAmounts: number[],
  amount: number,
  dates: DatesObj
) {
  let month: string = moment(datePosted, "YYYYMMDD").format("MMM");
  let year: number = parseInt(datePosted.slice(0, 4));

  allAmounts.push(amount);
  if (dates.currentYear === year) {
    if (dates.currentMonth === month) {
      currentMonthAmounts.push(amount);
    } else if (dates.lastMonth === month) {
      lastMonthAmounts.push(amount);
    }
  } else if (dates.lastYear === year) {
    if (dates.currentMonth === month) {
      lastYearCurrentMonthAmounts.push(amount);
    } else if (dates.lastMonth === month) {
      console.log(`transaction dates: { month:${month}, year:${year}}  
      dates.currentMonth:${dates.currentMonth}, dates.lastMonth:${dates.lastMonth},
      dates. currentYear${dates.currentYear} dates.lastYear:${dates.lastYear}`);
      lastYearLastMonthAmounts.push(amount);
    }
  }
  return {
    allAmounts,
    currentMonthAmounts,
    lastMonthAmounts,
    lastYearCurrentMonthAmounts,
    lastYearLastMonthAmounts,
  };
}

const createSubCategoryRow = (
  subCategoryId: string,
  subCategoryName: string,
  amount: number,
  datePosted: string,
  dates: DatesObj
): BudgetSubCategoryRow => {
  //working on sorting the dates. Need to pass transaction for dateposted somewhere.
  let allAmounts: number[] = [];
  let currentMonthAmounts: number[] = [];
  let lastYearCurrentMonthAmounts: number[] = [];
  let lastMonthAmounts: number[] = [];
  let lastYearLastMonthAmounts: number[] = [];

  let newAmountArrays = dateSortAmounts(
    datePosted,
    allAmounts,
    currentMonthAmounts,
    lastMonthAmounts,
    lastYearCurrentMonthAmounts,
    lastYearLastMonthAmounts,
    amount,
    dates
  );

  return {
    currentMonthAmounts: newAmountArrays.currentMonthAmounts,
    lastYearCurrentMonthAmounts: newAmountArrays.lastYearCurrentMonthAmounts,
    lastMonthAmounts: newAmountArrays.lastMonthAmounts,
    lastYearLastMonthAmounts: newAmountArrays.lastYearLastMonthAmounts,
    inputValue: 0,
    subCategoryId,
    subCategoryName,
    allAmounts: newAmountArrays.allAmounts,
  };
};
const createCategoryRow = (
  categoryId: string,
  categoryName: string,
  subCategoryId: string,
  subCategoryName: string,
  firstAmount: number,
  datePosted: string,
  dates: DatesObj
): BudgetCategoryRow => {
  let newSubCat: IBudgetSubCategoryRow = {};
  newSubCat[subCategoryId] = createSubCategoryRow(
    subCategoryId,
    subCategoryName,
    firstAmount,
    datePosted,
    dates
  );
  return {
    categoryId,
    categoryName,
    subCategoryLength: 0,
    subCategories: newSubCat,
  };
};

export const parseTransactionsForBudget = (
  transactions: TransactionEntity[],
  selectedTimeFrame: number,
  currentMonthTransactions: TransactionEntity[],
  lastMonthTransactions: TransactionEntity[],
  selectedBudget?: { id: string; values: string }
): ArrayedBudgetCategoryRow[] => {
  let currentMonth = moment().format("MMM");
  let lastMonth = moment().subtract(1, "month").format("MMM");
  let currentYear = parseInt(moment().format("YYYY"));
  let lastYear = parseInt(moment().subtract(1, "year").format("YYYY"));

  const dates = { currentMonth, lastMonth, currentYear, lastYear };
  let normDisplayData: IBudgetCategoryRow = {};

  console.log("ptfb156", selectedTimeFrame);

  console.log("PTFB104", currentMonthTransactions[0], lastMonthTransactions[0]);
  transactions.forEach((transaction) => {
    let { categoryId, subCategoryId } = transaction;
    let categoryName = transaction.category.name;
    let subCategoryName = transaction.subCategory.name;
    let amount = transaction.amount;
    let datePosted = transaction.datePosted;

    if (!Object.keys(normDisplayData).includes(categoryId)) {
      //create new category row

      normDisplayData[categoryId] = createCategoryRow(
        categoryId,
        categoryName,
        subCategoryId,
        subCategoryName,
        amount,
        datePosted,
        dates
      );
    } else {
      //category row exists. check if sub category exists
      if (
        !Object.keys(normDisplayData[categoryId].subCategories).includes(
          subCategoryId
        )
      ) {
        //create new subCategoryrow
        normDisplayData[categoryId].subCategories[
          subCategoryId
        ] = createSubCategoryRow(
          subCategoryId,
          subCategoryName,
          amount,
          datePosted,
          dates
        );
      } else {
        //just push amount
        dateSortAmounts(
          datePosted,
          normDisplayData[categoryId].subCategories[subCategoryId].allAmounts,
          normDisplayData[categoryId].subCategories[subCategoryId]
            .currentMonthAmounts,
          normDisplayData[categoryId].subCategories[subCategoryId]
            .lastMonthAmounts,
          normDisplayData[categoryId].subCategories[subCategoryId]
            .lastYearCurrentMonthAmounts,
          normDisplayData[categoryId].subCategories[subCategoryId]
            .lastYearLastMonthAmounts,
          amount,
          dates
        );
      }
    }
  });

  console.log("PTFB 145", selectedBudget);
  let budget: any = {};
  if (selectedBudget && selectedBudget.values) {
    budget.id = selectedBudget.id;
    budget.values = JSON.parse(selectedBudget.values);
  }

  console.log("PTFB 137", budget);
  //TODO left off here!!
  let arrayedDisplayData: ArrayedBudgetCategoryRow[] = Object.keys(
    normDisplayData
  ).map((categoryKey) =>
    Object.assign(
      {},
      { ...normDisplayData[categoryKey] },
      {
        subCategoryLength: Object.keys(
          normDisplayData[categoryKey].subCategories
        ).length,

        subCategories: Object.keys(
          normDisplayData[categoryKey].subCategories
        ).map((subCategoryKey) => {
          let avg =
            normDisplayData[categoryKey].subCategories[
              subCategoryKey
            ].allAmounts.reduce((acc, cur) => (acc += cur)) / selectedTimeFrame;
          let inputValue = avg;

          const checkForEmptyArray = (array: number[]): number => {
            if (array.length > 0) {
              return array.reduce((acc: number, cur: number) => (acc += cur));
            } else {
              return 0;
            }
          };

          let currentMonth = checkForEmptyArray(
            normDisplayData[categoryKey].subCategories[subCategoryKey]
              .currentMonthAmounts
          );

          let lastMonth = checkForEmptyArray(
            normDisplayData[categoryKey].subCategories[subCategoryKey]
              .lastMonthAmounts
          );

          let lastYearCurrentMonth = checkForEmptyArray(
            normDisplayData[categoryKey].subCategories[subCategoryKey]
              .lastYearCurrentMonthAmounts
          );
          let lastYearLastMonth = checkForEmptyArray(
            normDisplayData[categoryKey].subCategories[subCategoryKey]
              .lastYearLastMonthAmounts
          );

          if (
            budget &&
            budget.values &&
            Object.keys(budget.values).includes(subCategoryKey)
          ) {
            console.log(
              "Budget value found! using: ",
              budget.values[subCategoryKey].value
            );
            inputValue = numeral(budget.values[subCategoryKey].value).value();
          }
          return {
            currentMonth,
            lastMonth,
            lastYearCurrentMonth,
            lastYearLastMonth,
            avg,
            //TODO save budget and load them here or just use average values
            inputValue,
            subCategoryId:
              normDisplayData[categoryKey].subCategories[subCategoryKey]
                .subCategoryId,
            subCategoryName:
              normDisplayData[categoryKey].subCategories[subCategoryKey]
                .subCategoryName,
          };
        }),
      }
    )
  );

  arrayedDisplayData.forEach((category) => {
    category.subCategories.sort((a, b) => {
      if (a.avg > b.avg) return 1;
      if (a.avg < b.avg) return -1;
      return 0;
    });
  });

  arrayedDisplayData.sort((a, b) => {
    if (a.categoryName > b.categoryName) return 1;
    if (a.categoryName < b.categoryName) return -1;
    return 0;
  });

  console.log("PTFB 223: printing normDataDisplay");
  fs.writeFileSync(
    "./test.txt",
    util.inspect(arrayedDisplayData, { showHidden: true, depth: null })
  );
  return arrayedDisplayData;
};
