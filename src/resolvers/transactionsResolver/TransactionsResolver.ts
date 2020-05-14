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
} from "type-graphql";
import { BaseEntity, Between } from "typeorm";
import { isAuth } from "../../isAuth";
import { getUserIdFromHeader } from "../utils/getUserIdFromHeader";
import { MyContext } from "../../types";
import { TransactionEntity } from "../../entity/Transaction";
import { UserEntity } from "../../entity/User";
import moment from "moment";
import { SavedCategoriesEntity } from "../../entity/SavedCategories";
var util = require("util");
import fs from "fs";

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

  // @Query(() => [TransactionEntity] || Boolean)
  // async getUserTransactionsForCashFlow(
  //   @Ctx() context: MyContext
  // ): Promise<TransactionEntity[] | Boolean> {
  //   const userId = getUserIdFromHeader(context.req.headers["authorization"]!);
  //   if (!userId) {
  //     return false;
  //   }
  //   try {
  //     const transactions = await TransactionEntity.find({
  //       where: { userId },
  //       relations: ["category", "subCategory"],
  //     });
  //     if (transactions) {
  //       parseTransactionsForCashFlowAnalysis(transactions);

  //       return transactions;
  //     }
  //     return false;
  //   } catch (err) {
  //     console.log(err);
  //     return false;
  //   }
  //   return false;
  // }

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
        //if a saved category doesn't exist.
        console.log(
          "Apply to all true, category does not exist. creating new savedCategory"
        );
        try {
          //create one
          const newCategory = await SavedCategoriesEntity.create({
            name: data.name,
            memo: data.memo,
            book: data.selectedBook,
            amounts: [],
            userId,
            categoryId: data.selectedCategoryId,
            subCategoryId: data.selectedSubCategoryId,
          }).save();
          //update the transaction with newsavedCategory id

          console.log(
            "Created new category with selected categories: ",
            newCategory
          );
          await TransactionEntity.update(data.id, {
            book: data.selectedBook,
            note: data.note,
            categoryId: data.selectedCategoryId,
            subCategoryId: data.selectedSubCategoryId,
            savedCategoryId: newCategory.id,
          });

          //update all transactions with same n/m/b to the new saved category id
          console.log("updating all transactions with same n/m/b");
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
              savedCategoryId: newCategory.id,
            });
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
}
