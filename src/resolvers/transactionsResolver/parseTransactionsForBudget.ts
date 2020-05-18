//import moment from "moment";
var util = require("util");
import fs from "fs";
// import numeral from "numeral";
import { TransactionEntity } from "src/entity/Transaction";
import { Field, ObjectType, Float } from "type-graphql";

interface BudgetSubCategoryRow {
  inputValue: number;
  subCategoryId: string;
  subCategoryName: string;
  amounts: number[];
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

// interface DisplayData {
//   categoryId: string;
//   categoryName: string;
//   subCategoryLength: number;
//   subCategories: DisplaySubCategoryRow[];
// }
const createSubCategoryRow = (
  subCategoryId: string,
  subCategoryName: string,
  firstAmount: number
): BudgetSubCategoryRow => {
  return {
    inputValue: 0,
    subCategoryId,
    subCategoryName,
    amounts: [firstAmount],
  };
};
const createCategoryRow = (
  categoryId: string,
  categoryName: string,
  subCategoryId: string,
  subCategoryName: string,
  firstAmount: number
): BudgetCategoryRow => {
  let newSubCat: IBudgetSubCategoryRow = {};
  newSubCat[subCategoryId] = createSubCategoryRow(
    subCategoryId,
    subCategoryName,
    firstAmount
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
  selectedTimeFrame: number
): ArrayedBudgetCategoryRow[] => {
  let normDisplayData: IBudgetCategoryRow = {};
  transactions.forEach((transaction) => {
    let { categoryId, subCategoryId } = transaction;
    let categoryName = transaction.category.name;
    let subCategoryName = transaction.subCategory.name;
    let amount = transaction.amount;
    if (!Object.keys(normDisplayData).includes(categoryId)) {
      //create new category row
      normDisplayData[categoryId] = createCategoryRow(
        categoryId,
        categoryName,
        subCategoryId,
        subCategoryName,
        amount
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
        ] = createSubCategoryRow(subCategoryId, subCategoryName, amount);
      } else {
        //just push amount
        normDisplayData[categoryId].subCategories[subCategoryId].amounts.push(
          amount
        );
      }
    }
  });

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
            ].amounts.reduce((acc, cur) => (acc += cur)) / selectedTimeFrame;
          return {
            avg,
            inputValue: avg,
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
  fs.writeFileSync(
    "./test.txt",
    util.inspect(arrayedDisplayData, { showHidden: true, depth: null })
  );
  return arrayedDisplayData;
};
