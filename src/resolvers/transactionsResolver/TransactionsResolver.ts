import {
  Resolver,
  UseMiddleware,
  Ctx,
  Arg,
  InputType,
  Field,
  Mutation,
  Query,
  Float,
  Int,
  ObjectType,
} from "type-graphql";
import { BaseEntity, MoreThan, Not } from "typeorm";
import { isAuth } from "../../isAuth";
import { getUserIdFromHeader } from "../utils/getUserIdFromHeader";
import { MyContext } from "../../types";
import { TransactionEntity } from "../../entity/Transaction";
import { UserEntity } from "../../entity/User";
import moment from "moment";
import { SavedCategoriesEntity } from "../../entity/SavedCategories";
import { ICategoryRowSummary, IDisplayDataSummary } from "./types";
var util = require("util");
import fs from "fs";
import { initCategoryRows, newCategoryRow } from "./setupRows";
import {
  parseTransactionsForBudget,
  ArrayedBudgetCategoryRow,
} from "./parseTransactionsForBudget";
import { CategoryEntity } from "../../entity/Category";
import { BudgetsEntity } from "../../entity/Budgets";

@InputType()
export class updateCategoriesInTransactionsInput {
  @Field()
  id: string;
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  memo: string;
  @Field({ nullable: true })
  note: string;
  @Field(() => Float)
  amount: number;
  @Field({ nullable: true })
  savedCategoryId: string;
  @Field()
  selectedCategoryId: string;
  @Field()
  selectedSubCategoryId: string;
  @Field()
  book: string;
  @Field()
  selectedBook: string;
  @Field()
  applyToAll: boolean;
  @Field()
  noConflict: boolean;
}

@ObjectType()
class TransPageReturn {
  @Field(() => Int)
  length: number;
  @Field(() => [TransactionEntity])
  transactions: TransactionEntity[];
}

@Resolver()
export class TransactionsResolver extends BaseEntity {
  @Query(() => [TransactionEntity] || Boolean)
  async getUserTransactions(
    @Ctx() context: MyContext
  ): Promise<TransactionEntity[] | Boolean> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]!);
    if (!userId) {
      return false;
    }
    try {
      const user = await UserEntity.findOne(userId, {
        relations: ["transactions"],
      });
      if (user && user.transactions) {
        const data = user.transactions;
        return data;
      }
      return false;
    } catch (err) {
      console.log(err);
      return false;
    }
    return false;
  }

  @Query(() => TransactionEntity || Boolean)
  async getTransactionsById(
    @Arg("id") id: string,
    @Ctx() context: MyContext
  ): Promise<TransactionEntity | Boolean> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]!);
    if (!userId) {
      return false;
    }
    try {
      const transaction = await TransactionEntity.findOne(id, {
        relations: ["category", "subCategory"],
      });
      if (transaction) {
        return transaction;
      }
      return false;
    } catch (err) {
      console.log(err);
      return false;
    }
    return false;
  }

  @Query(() => [TransactionEntity] || Boolean)
  async getTransactionsByMonth(
    @Arg("month") month: string,
    @Arg("year", () => Int) year: number,
    @Ctx() context: MyContext
  ): Promise<TransactionEntity[] | Boolean> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]!);
    if (!userId) {
      return false;
    }
    try {
      //Maybe pagination here instead using FindAndCount
      const transactions = await TransactionEntity.find({
        where: { userId },
        relations: ["category", "subCategory", "savedCategory"],
      });
      const filteredTransactions = transactions.filter((transaction: any) => {
        const date = transaction.datePosted;
        const yearTest =
          moment(date, "YYYYMMDD").format("YYYY") === year.toString();
        const monthTest = moment(date, "YYYYMMDD").format("MMM") === month;
        if (yearTest && monthTest) {
          return true;
        } else {
          return false;
        }
      });

      filteredTransactions.sort(
        (a: TransactionEntity, b: TransactionEntity) => {
          let c = parseInt(a.datePosted);
          let d = parseInt(b.datePosted);
          if (d > c) return -1;
          if (d < c) return 1;
          if (a.amount > b.amount) return -1;
          if (a.amount < b.amount) return 1;

          return 0;
        }
      );

      return filteredTransactions;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  //Left off trying to figure out why transaction doesn't update when I switch the book value to 377 hyde park rd.
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async updateCategoriesInTransactions(
    @Arg("data")
    data: updateCategoriesInTransactionsInput,
    @Ctx() context: MyContext
  ): Promise<Boolean> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]!);
    if (!userId) {
      return false;
    }
    console.log("TR184 update transactions mutation running");
    console.log("TR185 arguments from frontend", data);
    //first, if apply to all is false things are easy. We don't want a savedCategory so if there is one delete it.
    //then updtate all transactions, but gotta update the transactions to savedCategory null first.
    if (!data.applyToAll) {
      console.log("apply to all: false");
      try {
        if (data.savedCategoryId) {
          console.log("Apply to all is false, category exists");

          //look for a saved category
          const savedCategory = await SavedCategoriesEntity.findOne(
            data.savedCategoryId,
            {
              relations: ["transactions"],
            }
          );

          // if a savedCategory exists set null in all transactions and delete the savedCategory
          if (savedCategory) {
            console.log("category found: updating savedCategoryId to null");
            for (let i = 0; i < savedCategory.transactions.length; i++) {
              await TransactionEntity.update(savedCategory.transactions[i].id, {
                savedCategoryId: null,
              });
            }
            console.log("delete savedCategory");
            const delres = await SavedCategoriesEntity.delete(
              data.savedCategoryId
            );
            console.log("deleted savedcategory: ", delres);
          } else {
            console.log("did not find a saved category for deletion.");
          }

          //update the single transaction
          console.log("Apply to all is false, updating transaction");
          await TransactionEntity.update(data.id, {
            book: data.selectedBook,
            note: data.note,
            categoryId: data.selectedCategoryId,
            subCategoryId: data.selectedSubCategoryId,
            savedCategoryId: null,
          });
        } else {
          //no saved category. still want to update every other transaction with same
          // n/m/b and delete saved category. and update the transaction.
          console.log(
            "there was no saved categoryId. checking for a savedCategory with n/m/b"
          );
          //find all transactions with same n/m/b
          let savedCategory = await SavedCategoriesEntity.findOne({
            where: {
              name: data.name,
              memo: data.memo,
              book: data.selectedBook,
            },
            relations: ["transactions"],
          });

          //set savedCateoryId to null if there are other trnsacations with n/m/b
          if (savedCategory) {
            console.log(
              "a savedCategory was found. savedCategoryId: ",
              savedCategory.id
            );

            for (let i = 0; i < savedCategory.transactions.length; i++) {
              await TransactionEntity.update(savedCategory.transactions[i].id, {
                savedCategoryId: null,
              });
            }

            //delete savedCategoryId
            await SavedCategoriesEntity.delete(savedCategory.id);
          }

          //update the single transaction
          await TransactionEntity.update(data.id, {
            book: data.selectedBook,
            note: data.note,
            categoryId: data.selectedCategoryId,
            subCategoryId: data.selectedSubCategoryId,
            savedCategoryId: null,
          });
        }
      } catch (err) {
        console.log("!data.apply to all block error", err);
      }
    } else {
      console.log("apply to all is true");
      //so now we want a savedCategoryId
      //does one exist already?
      if (!data.savedCategoryId) {
        //if a saved category doesn't exist, it might exist in the db already. check for duplicate saved categories
        //before making a new one.
        console.log(
          "Apply to all true, category from row does not exist, but it might already exist in the db."
        );
        try {
          const existingCategory = await SavedCategoriesEntity.findOne({
            where: {
              name: data.name,
              memo: data.memo,
              book: data.selectedBook,
            },
          });

          let savedCategoryId: string;
          if (existingCategory) {
            //use this id.

            console.log(
              "apply to all: true, no saved category from frontend. existing category found."
            );
            savedCategoryId = existingCategory.id;
          } else {
            //create one
            console.log(
              "apply to all: true, no saved category from frontend. no existing category"
            );
            const newCategory = await SavedCategoriesEntity.create({
              name: data.name,
              memo: data.memo,
              book: data.selectedBook,
              amounts: [],
              userId,
              categoryId: data.selectedCategoryId,
              subCategoryId: data.selectedSubCategoryId,
            }).save();

            savedCategoryId = newCategory.id;
            //update the transaction with newsavedCategory id
          }

          console.log(
            "Created or updated new category with selected categories: ",
            savedCategoryId
          );
          await TransactionEntity.update(data.id, {
            book: data.selectedBook,
            note: data.note,
            categoryId: data.selectedCategoryId,
            subCategoryId: data.selectedSubCategoryId,
            savedCategoryId: savedCategoryId,
          });

          //update all transactions with same n/m/b to the new saved category id
          if (data.noConflict) {
            console.log(
              "apply to all: true, no data.savedCategory, no existiing category in DB and noConflict is true."
            );
            //update book in all transaction for name and memo as well.
            //use this for transactions we know are a certain book either home or rental for sure
            //like BNS Mortgage, is not ambiguous.
            console.log("finding all transactions with same n/m");
            const transactions = await TransactionEntity.find({
              where: {
                name: data.name,
                memo: data.memo,
              },
            });

            console.log(
              "updating all transactions that have the shape: ",
              transactions[0]
            );
            for (let i = 0; i < transactions.length; i++) {
              await TransactionEntity.update(transactions[i].id, {
                categoryId: data.selectedCategoryId,
                subCategoryId: data.selectedSubCategoryId,
                savedCategoryId: savedCategoryId,
                book: data.selectedBook,
              });
            }
          } else {
            console.log("finding all transactions with same n/m/b");
            const transactions = await TransactionEntity.find({
              where: {
                name: data.name,
                memo: data.memo,
                book: data.selectedBook,
              },
            });
            console.log(
              "updating all transactions that have the shape: ",
              transactions[0]
            );
            for (let i = 0; i < transactions.length; i++) {
              await TransactionEntity.update(transactions[i].id, {
                categoryId: data.selectedCategoryId,
                subCategoryId: data.selectedSubCategoryId,
                savedCategoryId: savedCategoryId,
              });
            }
          }
        } catch (err) {
          console.log("error in applyToAll:true, no saved category found");
        }
      } else {
        try {
          console.log("apply to all is true, a savedCategory exists");
          //a savedcategory exists. the question is: did the book change as well?
          if (data.book === data.selectedBook) {
            console.log("the books are the same");
            //the book did not change. So we can use the existing savedCategoryId and update it
            // with new categories.

            console.log("update SavedCategory with new categories");
            let sceres = await SavedCategoriesEntity.update(
              data.savedCategoryId,
              {
                categoryId: data.selectedCategoryId,
                subCategoryId: data.selectedSubCategoryId,
              }
            );
            console.log("updated saved category. res: ", sceres);

            console.log("update the transaction with new categories");
            let TEres = await TransactionEntity.update(data.id, {
              note: data.note,
              categoryId: data.selectedCategoryId,
              subCategoryId: data.selectedSubCategoryId,
            });
            console.log("updated single transcation: ", TEres);

            console.log(
              "update all transactions with that saved categorId with new ids"
            );
            let savedCategory = await SavedCategoriesEntity.findOne(
              data.savedCategoryId,
              { relations: ["transactions"] }
            );
            console.log("searched for savedCategory: ", savedCategory);

            if (savedCategory) {
              console.log(
                "updating all transactions with shape: ",
                savedCategory.transactions[0]
              );
              for (let i = 0; i < savedCategory.transactions.length; i++) {
                await TransactionEntity.update(
                  savedCategory.transactions[i].id,
                  {
                    categoryId: data.selectedCategoryId,
                    subCategoryId: data.selectedSubCategoryId,
                  }
                );
              }
            } else {
              console.log("error , no saved category found");
            }
          } else {
            //book has changed.
            console.log(
              "book has changed. Does a savedCategory already exist in the db with the same n/m/b?"
            );
            let existingSavedCategory = await SavedCategoriesEntity.findOne({
              where: {
                name: data.name,
                memo: data.memo,
                book: data.selectedBook,
              },
            });

            if (existingSavedCategory) {
              try {
                //example: a transaction was categorized already with:
                //{book: "Home", applyToAll: true} so a category does exist in row.
                //now a change is made to book, and a saved category for that n/m/B exists.
                console.log(
                  "apply to all is true. data.savedCategoryId exists from frontend. The book has changed. there is an existing savedCategory. switch to that savedCategoryId"
                );

                console.log("update SavedCategory with newcategory ids.");
                await SavedCategoriesEntity.update(existingSavedCategory.id, {
                  categoryId: data.selectedCategoryId,
                  subCategoryId: data.selectedSubCategoryId,
                });

                console.log(
                  "update single transaction with category ids and existing savedCategoryid. update book because it changed."
                );
                await TransactionEntity.update(data.id, {
                  book: data.selectedBook,
                  savedCategoryId: existingSavedCategory.id,
                  categoryId: data.selectedCategoryId,
                  subCategoryId: data.selectedSubCategoryId,
                });

                console.log("find all transactions with n/m/b.");
                let transactions = await TransactionEntity.find({
                  where: {
                    name: data.name,
                    memo: data.memo,
                    book: data.selectedBook,
                  },
                });

                //write this should only find n/m/b transactions!
                fs.writeFileSync(
                  "./test2.txt",
                  util.inspect(transactions, { showHidden: true, depth: null })
                );

                console.log("update all transactions");
                //reset all transactions with the same n/m/b (newly selected book) to the
                //same categories, savedCategory..
                if (transactions.length > 0) {
                  console.log(
                    "update transactions with shape: ",
                    transactions[0]
                  );
                  for (let i = 0; i < transactions.length; i++) {
                    await TransactionEntity.update(transactions[i].id, {
                      categoryId: data.selectedCategoryId,
                      subCategoryId: data.selectedSubCategoryId,
                      savedCategoryId: existingSavedCategory.id,
                    });
                  }
                }
              } catch (err) {
                console.log("error inside existing saved category block", err);
              }
            } else {
              try {
                //example: a transaction was categorized already with:
                //{book: "Home", applyToAll: true} so a category does exist in row.
                //now a change is made to book, and a saved category for that n/m/B does not exist.
                console.log(
                  "apply to all is true. data.savedCategoryId exists from frontend. The book has changed. there is no existing savedCategory."
                );
                console.log(
                  "create new savedCategory because one doesn't exist to switch to. (we swtiched books)"
                );
                let newSavedCategory = await SavedCategoriesEntity.create({
                  name: data.name,
                  memo: data.memo,
                  book: data.selectedBook,
                  amounts: [],
                  userId,
                  categoryId: data.selectedCategoryId,
                  subCategoryId: data.selectedSubCategoryId,
                }).save();
                console.log("create new SavedCategory: ", newSavedCategory);

                console.log("update single transaction");
                await TransactionEntity.update(data.id, {
                  book: data.selectedBook,
                  savedCategoryId: newSavedCategory.id,
                  categoryId: data.selectedCategoryId,
                  subCategoryId: data.selectedSubCategoryId,
                });

                console.log("find all transactions with n/m/b.");
                let transactions = await TransactionEntity.find({
                  where: {
                    name: data.name,
                    memo: data.memo,
                    book: data.selectedBook,
                  },
                });

                //write this should only find n/m/b transactions!
                fs.writeFileSync(
                  "./test.txt",
                  util.inspect(transactions, { showHidden: true, depth: null })
                );
                console.log(
                  "update all transactions with n/m/b with new categories and new saved category"
                );
                if (transactions.length > 0) {
                  console.log(
                    "update transactions with shape: ",
                    transactions[0]
                  );
                  for (let i = 0; i < transactions.length; i++) {
                    await TransactionEntity.update(transactions[i].id, {
                      categoryId: data.selectedCategoryId,
                      subCategoryId: data.selectedSubCategoryId,
                      savedCategoryId: newSavedCategory.id,
                    });
                  }
                }
              } catch (err) {
                console.log(
                  "error inside no existing saved category block",
                  err
                );
              }
            }
          }
        } catch (err) {
          console.log(
            "error in the applyToAll:true, savedCategoryexists block",
            err
          );
        }
      }
    }
    return true;
  }

  @Query(() => [IDisplayDataSummary] || Boolean)
  async getTotalsForSummary(
    @Ctx() context: MyContext
  ): Promise<IDisplayDataSummary[] | Boolean> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]!);
    if (!userId) {
      return false;
    }

    let normDisplayData: ICategoryRowSummary = initCategoryRows();
    let displayData: IDisplayDataSummary[] = [];

    try {
      const transactions = await TransactionEntity.find({ where: { userId } });
      if (transactions) {
        //Make book if none exists
        transactions.forEach((transaction) => {
          if (!Object.keys(normDisplayData).includes(transaction.book)) {
            //no book. create new CategoryRow
            normDisplayData[transaction.book] = newCategoryRow(
              transaction.book,
              transaction.book
            );
          }
          //Make Year if none exists
          let year = transaction.datePosted.slice(0, 4);
          Object.keys(normDisplayData).forEach((key) => {
            if (!Object.keys(normDisplayData[key].years).includes(year)) {
              //year does not exist. make new onefor every for category and subcategory rows
              normDisplayData[key].years[year] = {
                year,
                amount: 0,
              };
              normDisplayData[key].subCategories.income.years[year] = {
                year,
                amount: 0,
              };
              normDisplayData[key].subCategories.expenses.years[year] = {
                year,
                amount: 0,
              };
            }
          });

          //console.log("TR608", normDisplayData[transaction.book]);
          normDisplayData.grandTotal.years[year].amount += transaction.amount;
          normDisplayData[transaction.book].years[year].amount +=
            transaction.amount;
          if (transaction.amount > 0) {
            normDisplayData[transaction.book].subCategories.income.years[
              year
            ].amount += transaction.amount;
            normDisplayData.grandTotal.subCategories.income.years[
              year
            ].amount += transaction.amount;
          } else {
            normDisplayData[transaction.book].subCategories.expenses.years[
              year
            ].amount += transaction.amount;
            normDisplayData.grandTotal.subCategories.expenses.years[
              year
            ].amount += transaction.amount;
          }

          displayData = Object.keys(normDisplayData).map((key) => {
            return Object.assign(
              {},
              { ...normDisplayData[key] },
              {
                years: Object.keys(normDisplayData[key].years).map(
                  (yearKey) => normDisplayData[key].years[yearKey]
                ),
              },
              {
                subCategories: Object.keys(
                  normDisplayData[key].subCategories
                ).map((subCategoryKey) =>
                  Object.assign(
                    {},
                    { ...normDisplayData[key].subCategories[subCategoryKey] },
                    {
                      years: Object.keys(
                        normDisplayData[key].subCategories[subCategoryKey].years
                      ).map(
                        (yearKey) =>
                          normDisplayData[key].subCategories[subCategoryKey]
                            .years[yearKey]
                      ),
                    }
                  )
                ),
              }
            );
          });
          // fs.writeFileSync(
          //   "./test.js",
          //   util.inspect(displayData, { showHidden: true, depth: null })
          // );
        });
      } else {
        return false;
      }
      return displayData;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  @Query(() => [ArrayedBudgetCategoryRow] || Boolean)
  async getUserTransactionsForBudget(
    @Arg("book") book: string,
    @Arg("selectedTimeFrame", () => Float!) selectedTimeFrame: number,
    @Arg("selectedBudget") selectedBudget: string,
    @Ctx() context: MyContext
  ): Promise<ArrayedBudgetCategoryRow[] | Boolean> {
    const userId: string | null = getUserIdFromHeader(
      context.req.headers["authorization"]
    );

    if (!userId) {
      return false;
    }
    try {
      let startDate = parseInt(
        moment().subtract(selectedTimeFrame, "months").format("YYYYMMDD")
      );

      let zzignoreCat = await CategoryEntity.findOne({
        where: { name: "zzIgnore" },
      });

      const transactions = await TransactionEntity.find({
        where: {
          userId,
          datePosted: MoreThan(startDate),
          categoryId: Not(zzignoreCat!.id),
          book,
        },
        relations: ["category", "subCategory"],
      });

      let budget: BudgetsEntity | undefined;
      if (selectedBudget !== "Default Budget") {
        budget = await BudgetsEntity.findOne({
          where: { id: selectedBudget },
        });
      }
      console.log("PTFB 134", budget);
      let parsedBudget = {
        id: "",
        values: "",
      };
      if (budget) {
        parsedBudget = { id: budget.id, values: budget.values };
      }

      if (transactions) {
        let parsedData = parseTransactionsForBudget(
          transactions,
          selectedTimeFrame,
          parsedBudget
        );
        // fs.writeFileSync(
        //   "./test.txt",
        //   util.inspect(parsedData, { showHidden: true, depth: null })
        // );
        return parsedData;
      }
      //return displayData;

      return false;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  @Query(() => TransPageReturn || Boolean)
  async getUserTransactionsForTransactionsPage(
    @Ctx() context: MyContext,
    @Arg("skip", () => Int) skip: number,
    @Arg("take", () => Int) take: number,
    @Arg("filter") filter: string,
    //Add arguments for selected columns
    //@Arg("datePosted") datePosted: boolean,
    @Arg("order") order: string,
    @Arg("month", { nullable: true }) month?: string,
    @Arg("year", () => Int, { nullable: true }) year?: number
  ): Promise<TransPageReturn | Boolean> {
    const userId: string | null = getUserIdFromHeader(
      context.req.headers["authorization"]
    );

    if (!userId) {
      return false;
    }
    type Order = keyof TransactionEntity;
    // let selectedFields: Order[] = ["name"];
    // if (datePosted) selectedFields.push("datePosted");

    try {
      let transactions = await TransactionEntity.find({
        where: { userId },
        // select: selectedFields,
        relations: ["category", "subCategory", "savedCategory"],
      });
      console.log("TR771", transactions);

      let dateFilteredTransactions = transactions;

      if (month && year) {
        dateFilteredTransactions = transactions.filter((transaction: any) => {
          const date = transaction.datePosted;
          const yearTest =
            moment(date, "YYYYMMDD").format("YYYY") === year.toString();
          const monthTest = moment(date, "YYYYMMDD").format("MMM") === month;
          if (yearTest && monthTest) {
            return true;
          } else {
            return false;
          }
        });
      }

      let filteredTransactions = dateFilteredTransactions.filter(
        (transaction) => {
          return (
            (transaction.name &&
              transaction.name.toLowerCase().includes(filter)) ||
            (transaction.memo &&
              transaction.memo.toLowerCase().includes(filter)) ||
            transaction.category.name.toLowerCase().includes(filter) ||
            transaction.subCategory.name.toLowerCase().includes(filter)
          );
        }
      );
      let length = filteredTransactions.length;
      //console.log("TR791 ", filteredTransactions);
      let sortedTransactions = filteredTransactions.sort((a, b) => {
        if (!a[order as Order] || !b[order as Order]) return 0;
        if (a[order as Order]! > b[order as Order]!) return 1;
        if (a[order as Order]! < b[order as Order]!) return -1;
        return 0;
      });

      console.log("tr792", sortedTransactions);

      let slicedTransactions = sortedTransactions.slice(
        skip * take,
        skip * take + take
      );
      console.log("tr796", slicedTransactions);

      return { length, transactions: slicedTransactions };
      return false;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
}
