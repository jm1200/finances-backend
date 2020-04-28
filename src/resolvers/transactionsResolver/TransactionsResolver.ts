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
import { BaseEntity } from "typeorm";
import { isAuth } from "../../isAuth";
import { getUserIdFromHeader } from "../utils/getUserIdFromHeader";
import { MyContext } from "../../types";
import { TransactionEntity } from "../../entity/Transaction";
import { UserEntity } from "../../entity/User";
import moment from "moment";

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
  name?: string;
  @Field({ nullable: true })
  savedCategoryId: string;
  @Field({ nullable: true })
  memo?: string;
  @Field({ nullable: true })
  categoryId: string;
  @Field({ nullable: true })
  subCategoryId: string;
  @Field({ nullable: true })
  note?: string;
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
        relations: ["category", "subCategory"],
      });
      console.log("TR 131 starting filtered transactions");
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

  // @Query(() => [IGroupedTransactionsClass] || Boolean)
  // async getTransactionsToCategorize(
  //   @Ctx() context: MyContext
  // ): Promise<IGroupedTransactionsClass[] | Boolean> {
  //   const userId = getUserIdFromHeader(context.req.headers["authorization"]!);
  //   if (!userId) {
  //     return false;
  //   }
  //   try {
  //     const transactions = await TransactionEntity.find({
  //       where: { userId },
  //       relations: ["category", "subCategory"],
  //     });

  //     if (transactions.length === 0) {
  //       return false;
  //     }

  //     let groupedTransactions: IGroupedTransactionsMap = {};
  //     transactions.forEach((transaction) => {
  //       const keyName = transaction.keyName(transaction);
  //       if (Object.keys(groupedTransactions).includes(keyName)) {
  //         groupedTransactions[keyName].ids.push(transaction.id);
  //         groupedTransactions[keyName].amounts.push(transaction.amount);
  //         groupedTransactions[keyName].averageAmount =
  //           groupedTransactions[keyName].amounts.reduce((acc, cur) => {
  //             return (acc += cur);
  //           }) / groupedTransactions[keyName].amounts.length;
  //       } else {
  //         groupedTransactions[keyName] = {
  //           id: keyName,
  //           datePosted: transaction.datePosted,
  //           name: transaction.name,
  //           memo: transaction.memo,
  //           note: transaction.note,
  //           amounts: [transaction.amount],
  //           averageAmount: transaction.amount,
  //           subCategoryName: transaction.subCategory.name,
  //           categoryName: transaction.category.name,
  //           ids: [transaction.id],
  //         };
  //       }
  //     });

  //     const arrayedGroupedTransactions: IGroupedTransactionsClass[] = [];
  //     Object.keys(groupedTransactions).forEach((keyName) => {
  //       arrayedGroupedTransactions.push(groupedTransactions[keyName]);
  //     });

  //     const data = arrayedGroupedTransactions.sort(
  //       (a: IGroupedTransactionsClass, b: IGroupedTransactionsClass) => {
  //         let c = parseInt(a.datePosted);
  //         let d = parseInt(b.datePosted);
  //         if (d < c) return -1;
  //         if (d > c) return 1;

  //         return 0;
  //       }
  //     );

  //     return data;
  //   } catch (err) {
  //     console.log(err);
  //     return false;
  //   }
  //   return false;
  // }

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

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async updateCategoriesInAllTransactions(
    @Arg("data")
    {
      name,
      memo,
      categoryId,
      subCategoryId,
      note,
      savedCategoryId,
    }: updateAllTransactionsInput,
    @Ctx() context: MyContext
  ): Promise<Boolean> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]!);
    if (!userId) {
      return false;
    }

    try {
      const transactions = await TransactionEntity.find({
        where: {
          name,
          memo,
        },
      });

      console.log("TR 289 ", transactions);
      transactions.forEach(async (transaction) => {
        const res = await TransactionEntity.update(transaction.id, {
          categoryId,
          subCategoryId,
          name,
          memo,
          note,
          savedCategoryId,
        });

        console.log("TR 302", res);
      });

      return true;
    } catch (err) {
      console.log(err);
      console.log("error inserting name: ", name);
      return false;
    }
  }
}
