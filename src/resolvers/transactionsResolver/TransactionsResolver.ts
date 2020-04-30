import {
  Resolver,
  UseMiddleware,
  Ctx,
  Arg,
  InputType,
  Field,
  Mutation,
  Query,
  ObjectType,
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

@InputType()
export class updateTransactionInput {
  @Field()
  id: string;
  @Field({ nullable: true })
  categoryId: string;
  @Field({ nullable: true })
  subCategoryId: string;
  @Field({ nullable: true })
  note: string;
  @Field({ nullable: true })
  savedCategoryId: string;
}
@InputType()
export class updateAllTransactionsInput {
  @Field({ nullable: true })
  name: string;
  @Field({ nullable: true })
  memo: string;
  @Field({ nullable: true })
  note: string;
  @Field(() => Float, { nullable: true })
  amount?: number;
  @Field({ nullable: true })
  savedCategoryId?: string;
  @Field({ nullable: true })
  categoryId?: string;
  @Field({ nullable: true })
  subCategoryId?: string;
}
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
  savedCategoryId?: string;
  @Field({ nullable: true })
  categoryId?: string;
  @Field({ nullable: true })
  subCategoryId?: string;

  @Field()
  checkAmount: boolean;
  @Field()
  applyToAll: boolean;
}

@ObjectType()
export class IGroupedTransactionsClass {
  @Field()
  id: string;
  @Field()
  datePosted: string;
  @Field()
  name: string;
  @Field()
  memo: string;
  @Field()
  note: string;
  @Field(() => [Float!]!)
  amounts: number[];
  @Field(() => Float!)
  averageAmount: number;
  @Field()
  categoryName: string;
  @Field()
  subCategoryName: string;
  @Field(() => [String])
  ids: string[];
}
// interface IGroupedTransactions {
//   id: string;
//   name: string;
//   memo: string;
//   subCategoryName: string;
//   categoryName: string;
//   ids: string[];
// }
// interface IGroupedTransactionsMap {
//   [key: string]: IGroupedTransactionsClass;
// }

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

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async updateCategoriesInTransaction(
    @Arg("data")
    {
      id,
      categoryId,
      subCategoryId,
      note,
      savedCategoryId,
    }: updateTransactionInput,
    @Ctx() context: MyContext
  ): Promise<Boolean> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]!);
    if (!userId) {
      return false;
    }

    try {
      await TransactionEntity.update(id, {
        categoryId,
        subCategoryId,
        note,
        savedCategoryId,
      });
      return true;
    } catch (err) {
      console.log(err);
      console.log("error inserting id: ", id);
      return false;
    }
  }
  //In the middle of updating this resolver to compare amounts as well as name, memo, note
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async updateCategoriesInAllTransactions(
    @Arg("data")
    data: updateAllTransactionsInput,
    @Ctx() context: MyContext
  ): Promise<Boolean> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]!);
    if (!userId) {
      return false;
    }
    //this is not going to work mcdonalds transaction amounts vary by more than 10%
    try {
      const transactions = await TransactionEntity.find({
        where: {
          name: data.name,
          memo: data.memo,
          note: data.note,
        },
      });

      transactions.forEach(async (transaction) => {
        await TransactionEntity.update(transaction.id, {
          ...data,
        });
      });

      return true;
    } catch (err) {
      console.log(err);
      console.log("error inserting name: ", name);
      return false;
    }
  }

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

    try {
      console.log("TR291 input ", data);

      // let transactions: TransactionEntity[];

      if (data.checkAmount) {
        let low: number;
        let high: number;

        if (data.amount < 0) {
          low = data.amount * 1.1;
          high = data.amount * 0.9;
        } else {
          high = data.amount * 1.1;
          low = data.amount * 0.9;
        }
        let transactions = await TransactionEntity.find({
          where: {
            name: data.name,
            memo: data.memo,
            note: data.note,
            amount: Between(low, high),
          },
        });
        if (data.savedCategoryId) {
          if (data.applyToAll) {
            console.log(
              `Test: checkAmount: ${data.checkAmount}, applyToAll: ${data.applyToAll}, savedCategoryId: ${data.savedCategoryId}`
            );
            //Update saved category with new names, selectedCategories and amount

            try {
              await SavedCategoriesEntity.update(data.savedCategoryId, {
                name: data.name,
                memo: data.memo,
                categoryId: data.categoryId,
                subCategoryId: data.subCategoryId,
                amount: data.amount,
              });
            } catch (err) {
              console.log("TR 318", err);
            }

            //update all transactions with new categories only. savedCategoryId should exist already because
            //a savedCategory exists AND applyToAll is checked.

            transactions.forEach(async (transaction) => {
              try {
                await TransactionEntity.update(transaction.id, {
                  note: undefined,
                  categoryId: data.categoryId,
                  subCategoryId: data.subCategoryId,
                });
              } catch (err) {
                console.log("TR 329", err);
              }
            });
          } else {
            console.log(
              `Test: checkAmount: ${data.checkAmount}, applyToAll: ${data.applyToAll}, savedCategoryId: ${data.savedCategoryId}`
            );
            //we no longer wish to applyToAll for the select transaction.
            //so first remove the savedCategoryIds from all transactions that were found.
            transactions.forEach(async (transaction) => {
              try {
                await TransactionEntity.update(transaction.id, {
                  note: undefined,
                  savedCategoryId: null,
                });
              } catch (err) {
                console.log("TR 343", err);
              }
            });
            //then update the single transaction in case new categories were selected
            try {
              await TransactionEntity.update(data.id, {
                note: data.note,
                categoryId: data.categoryId,
                subCategoryId: data.subCategoryId,
              });
            } catch (err) {
              console.log("TR 352", err);
            }
            //then delete the savedCategory
            try {
              await SavedCategoriesEntity.delete(data.savedCategoryId);
            } catch (err) {
              console.log("TR 356", err);
            }
          }
        } else {
          if (data.applyToAll) {
            console.log(
              `Test: checkAmount: ${data.checkAmount}, applyToAll: ${data.applyToAll}, savedCategoryId: ${data.savedCategoryId}`
            );
            //no savedCategory exists, so create one to use. data.amount exists, so use it instead of null.
            try {
              SavedCategoriesEntity.create({
                userId,
                name: data.name,
                memo: data.memo,
                amount: data.amount,
                categoryId: data.categoryId,
                subCategoryId: data.subCategoryId,
              })
                .save()
                .then(async (newCategoryData) => {
                  //update all transactions with new categories only and new savedCategoryId.
                  transactions.forEach(async (transaction) => {
                    console.log(
                      `updating ${transaction.name}, 
                      id: ${transaction.id}, 
                      with updated categoryId: ${data.categoryId}, 
                      updated subCategoryId: ${data.subCategoryId}, 
                      savedCategoryId: ${newCategoryData.id}`
                    );
                    await TransactionEntity.update(transaction.id, {
                      note: undefined,
                      categoryId: data.categoryId,
                      subCategoryId: data.subCategoryId,
                      savedCategoryId: newCategoryData.id,
                    });
                  });
                });
            } catch (err) {
              console.log("TR 408, ", err);
            }
          } else {
            console.log(
              `Test: checkAmount: ${data.checkAmount}, applyToAll: ${data.applyToAll}, savedCategoryId: ${data.savedCategoryId}`
            );
            //no savedCategory exists, so nothing to delete. Just need to update a single transaction
            // in case categories changed. SavedCategory doesn't exist so it should be null already.
            try {
              await TransactionEntity.update(data.id, {
                note: data.note,
                categoryId: data.categoryId,
                subCategoryId: data.subCategoryId,
              });
            } catch (err) {
              console.log("TR 410", err);
            }
          }
        }
      } else {
        //amount does not exist so don't check for amount.
        let transactions = await TransactionEntity.find({
          where: {
            name: data.name,
            memo: data.memo,
            note: data.note,
          },
        });
        if (data.savedCategoryId) {
          if (data.applyToAll) {
            console.log(
              `Test: checkAmount: ${data.checkAmount}, applyToAll: ${data.applyToAll}, savedCategoryId: ${data.savedCategoryId}`
            );
            //Update saved category with new selectedCategories only. make sure amount is null.
            try {
              await SavedCategoriesEntity.update(data.savedCategoryId, {
                name: data.name,
                memo: data.memo,
                categoryId: data.categoryId,
                subCategoryId: data.subCategoryId,
                amount: null,
              });
            } catch (err) {
              console.log("TR 436", err);
            }

            //update all transactions with new categories only. savedCategoryId should exist already because
            //a savedCategory exists AND applyToAll is checked.
            transactions.forEach(async (transaction) => {
              try {
                await TransactionEntity.update(transaction.id, {
                  note: undefined,
                  categoryId: data.categoryId,
                  subCategoryId: data.subCategoryId,
                });
              } catch (err) {
                console.log("TR 451", err);
              }
            });
          } else {
            console.log(
              `Test: checkAmount: ${data.checkAmount}, applyToAll: ${data.applyToAll}, savedCategoryId: ${data.savedCategoryId}`
            );
            //we no longer wish to applyToAll for the select transaction.
            //so first remove the savedCategoryIds from all transactions that were found.
            transactions.forEach(async (transaction) => {
              try {
                await TransactionEntity.update(transaction.id, {
                  note: undefined,
                  savedCategoryId: null,
                });
              } catch (err) {
                console.log("TR 465", err);
              }
            });

            //then update the single transaction in case new categories were selected
            try {
              await TransactionEntity.update(data.id, {
                note: data.note,
                categoryId: data.categoryId,
                subCategoryId: data.subCategoryId,
              });
            } catch (err) {
              console.log("TR 475", err);
            }

            //then delete the savedCategory
            try {
              await SavedCategoriesEntity.delete(data.savedCategoryId);
            } catch (err) {
              console.log("TR 480", err);
            }
          }
        } else {
          if (data.applyToAll) {
            console.log(
              `Test: checkAmount: ${data.checkAmount}, applyToAll: ${data.applyToAll}, savedCategoryId: ${data.savedCategoryId}`
            );
            //no savedCategory exists, so create one to use. data.amount does not exist, so use null.

            await SavedCategoriesEntity.create({
              userId,
              name: data.name,
              memo: data.memo,
              amount: null,
              categoryId: data.categoryId,
              subCategoryId: data.subCategoryId,
            })
              .save()
              .then((data) => {
                //update all transactions with new categories only and new savedCategoryId.
                transactions.forEach(async (transaction) => {
                  try {
                    await TransactionEntity.update(transaction.id, {
                      note: undefined,
                      categoryId: data.categoryId,
                      subCategoryId: data.subCategoryId,
                      savedCategoryId: data.id,
                    });
                  } catch (err) {
                    console.log("TR 516", err);
                  }
                });
              });
          } else {
            console.log(
              `Test: checkAmount: ${data.checkAmount}, applyToAll: ${data.applyToAll}, savedCategoryId: ${data.savedCategoryId}`
            );
            //no savedCategory exists, so nothing to delete. Just need to update a single transaction
            // in case categories changed. Saved category should already be null.
            try {
              await TransactionEntity.update(data.id, {
                note: data.note,
                categoryId: data.categoryId,
                subCategoryId: data.subCategoryId,
              });
            } catch (err) {
              console.log("TR 530", err);
            }
          }
        }
      }

      return true;
    } catch (err) {
      console.log(err);
      console.log("error inserting name: ", name);
      return false;
    }
  }
}
