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
  @Field()
  book: string;
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

    //Maybe need selectedBook and book to be separtae

    const updateTransactions = async (
      name: string,
      memo: string,
      book: string,
      note: string,
      selectedCategoryId: string,
      selectedSubCategoryId: string,
      savedCategoryId: string | null
    ): Promise<void> => {
      try {
        let transactions: TransactionEntity[];
        transactions = await TransactionEntity.find({
          where: { name, memo, book },
        });
        transactions.forEach((transaction) => {
          TransactionEntity.update(transaction.id, {
            categoryId: selectedCategoryId,
            subCategoryId: selectedSubCategoryId,
            savedCategoryId,
            book,
            note,
          });
        });
      } catch (err) {
        console.log("TR234", err);
      }
    };
    try {
      if (!data.applyToAll) {
        //if applyToall is false, we don't want a saved category.
        try {
          //if a saved category exists, delete it from every transactions first,
          //then delete the category
          if (data.savedCategoryId) {
            const savedCategory = await SavedCategoriesEntity.findOne(
              data.savedCategoryId,
              {
                relations: ["transactions"],
              }
            );
            if (savedCategory) {
              for (let i = 0; i < savedCategory.transactions.length; i++) {
                try {
                  await TransactionEntity.update(
                    savedCategory.transactions[i].id,
                    {
                      savedCategoryId: null,
                    }
                  );
                } catch (err) {
                  console.log("TR215, ", err);
                }
              }
              try {
                await SavedCategoriesEntity.delete(data.savedCategoryId);
              } catch (err) {
                console.log("TR239 ", err);
              }
            }
          }
          //we still want to update the single category
          try {
            await TransactionEntity.update(data.id, {
              book: data.book,
              note: data.note,
              categoryId: data.selectedCategoryId,
              subCategoryId: data.selectedSubCategoryId,
              savedCategoryId: null,
            });
          } catch (err) {
            console.log("TR227, ", err);
          }
        } catch (err) {
          console.log("Error trying to delete saved Category, ", err);
        }
      } else {
        //applyToAll is true, we want a saved category
        //two posibilites
        if (data.savedCategoryId) {
          //if one already exists, update all transactions

          updateTransactions(
            data.name,
            data.memo,
            data.book,
            data.note,
            data.selectedCategoryId,
            data.selectedSubCategoryId,
            data.savedCategoryId
          );
          // and update the one transaction
          try {
            await TransactionEntity.update(data.id, {
              book: data.book,
              note: data.note,
              categoryId: data.selectedCategoryId,
              subCategoryId: data.selectedSubCategoryId,
              savedCategoryId: data.savedCategoryId,
            });
          } catch (err) {
            console.log("TR227, ", err);
          }
        } else {
          SavedCategoriesEntity.create({
            name: data.name,
            memo: data.memo,
            book: data.book,
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
                data.book,
                data.note,
                data.selectedCategoryId,
                data.selectedSubCategoryId,
                res.id
              );
              return res;
            })
            .then((res) => {
              TransactionEntity.update(data.id, {
                book: data.book,
                note: data.note,
                categoryId: data.selectedCategoryId,
                subCategoryId: data.selectedSubCategoryId,
                savedCategoryId: res.id,
              });
            })
            .catch((err) => {
              console.log("TR376", err);
            });
          // }
        }
      }
      //update note by itself
      await TransactionEntity.update(data.id, { note: data.note });
      return true;
    } catch (err) {
      console.log("TR263", err);
      return false;
    }
  }
}
