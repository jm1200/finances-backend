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
  @Field(() => [Float], { nullable: true })
  savedCategoryAmounts: [number];
  @Field()
  selectedCategoryId: string;
  @Field()
  selectedSubCategoryId: string;
  @Field()
  checkAmount: boolean;
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
      const updateTransactions = async (
        name: string,
        memo: string,
        selectedCategoryId: string,
        selectedSubCategoryId: string,
        savedCategoryId: string | null,
        amount?: number
      ): Promise<void> => {
        let transactions: TransactionEntity[];
        if (amount) {
          let low: number;
          let high: number;

          if (data.amount < 0) {
            low = data.amount * 1.1;
            high = data.amount * 0.9;
          } else {
            high = data.amount * 1.1;
            low = data.amount * 0.9;
          }
          transactions = await TransactionEntity.find({
            where: { name, memo, amount: Between(low, high) },
          });
        } else {
          transactions = await TransactionEntity.find({
            where: { name, memo },
          });
        }
        transactions.forEach(async (transaction) => {
          await TransactionEntity.update(transaction.id, {
            categoryId: selectedCategoryId,
            subCategoryId: selectedSubCategoryId,
            savedCategoryId,
          });
        });
      };

      if (!data.applyToAll) {
        //if applyToall is false, we don't want a saved category.
        try {
          //if a saved category exists, delete it from every transactions first,
          //then delete the category
          if (data.savedCategoryId) {
            SavedCategoriesEntity.findOne(data.savedCategoryId, {
              relations: ["transactions"],
            })
              .then((savedCategory) => {
                savedCategory!.transactions.forEach(async (transaction) => {
                  await TransactionEntity.update(transaction.id, {
                    savedCategoryId: null,
                  });
                });
              })
              .then(async () => {
                await SavedCategoriesEntity.delete(data.savedCategoryId);
              });
          }
          //we still want to update the single category
          await TransactionEntity.update(data.id, {
            categoryId: data.selectedCategoryId,
            subCategoryId: data.selectedSubCategoryId,
            savedCategoryId: null,
          });
        } catch (err) {
          console.log("Error trying to delete saved Category, ", err);
        }
      } else {
        //applyToAll is true, we want a saved category
        if (data.savedCategoryId) {
          //if one already exists, update it with new amount
          let savedCategory = await SavedCategoriesEntity.findOne(
            data.savedCategoryId
          );
          if (data.checkAmount) {
            //update saved category and transactions with amount
            if (!data.savedCategoryAmounts.includes(data.amount)) {
              if (savedCategory) {
                let newAmounts: number[] = savedCategory.amounts;
                newAmounts.push(data.amount);
                await SavedCategoriesEntity.update(data.savedCategoryId, {
                  amounts: newAmounts,
                });
              }
            }

            updateTransactions(
              data.name,
              data.memo,
              data.selectedCategoryId,
              data.selectedSubCategoryId,
              data.savedCategoryId,
              data.amount
            );
          } else {
            //update saved category and transactions without amount
            if (savedCategory) {
              let newAmounts: number[] = savedCategory.amounts;
              let amounts = newAmounts.filter(
                (amount) => amount !== data.amount
              );
              await SavedCategoriesEntity.update(data.savedCategoryId, {
                amounts,
              });
            }
            updateTransactions(
              data.name,
              data.memo,
              data.selectedCategoryId,
              data.selectedSubCategoryId,
              data.savedCategoryId
            );
          }
        } else {
          //no savedCategory exists, so create one depending on
          //whether checkAmount is true.
          if (data.checkAmount) {
            SavedCategoriesEntity.create({
              name: data.name,
              memo: data.memo,
              amounts: [data.amount],
              userId,
              categoryId: data.selectedCategoryId,
              subCategoryId: data.selectedSubCategoryId,
            })
              .save()
              .then((res) => {
                updateTransactions(
                  data.name,
                  data.memo,
                  data.selectedCategoryId,
                  data.selectedSubCategoryId,
                  res.id,
                  data.amount
                );
              });
          } else {
            SavedCategoriesEntity.create({
              name: data.name,
              memo: data.memo,
              amounts: [],
              userId,
              categoryId: data.selectedCategoryId,
              subCategoryId: data.selectedSubCategoryId,
            })
              .save()
              .then((res) => {
                updateTransactions(
                  data.name,
                  data.memo,
                  data.selectedCategoryId,
                  data.selectedSubCategoryId,
                  res.id
                );
              });
          }
        }
      }

      await TransactionEntity.update(data.id, { note: data.note });
      return true;
    } catch (err) {
      console.log("TR263", err);
      return false;
    }
  }
}
