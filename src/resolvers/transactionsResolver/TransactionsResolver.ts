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
} from "type-graphql";
import { BaseEntity } from "typeorm";
import { isAuth } from "../../isAuth";
import { getUserIdFromHeader } from "../utils/getUserIdFromHeader";
import { MyContext } from "../../types";
import { TransactionEntity } from "../../entity/Transaction";
import { UserEntity } from "../../entity/User";

@InputType()
export class updateTransactionInput {
  @Field(() => [String])
  ids: string[];
  @Field({ nullable: true })
  categoryId: string;
  @Field({ nullable: true })
  subCategoryId: string;
}

@ObjectType()
export class IGroupedTransactionsClass {
  @Field()
  id: string;
  @Field()
  name: string;
  @Field()
  memo: string;
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
interface IGroupedTransactionsMap {
  [key: string]: IGroupedTransactionsClass;
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
        const data = user.transactions.slice(0, 5);
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
      const transaction = await TransactionEntity.findOne(id);
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

  @Query(() => [IGroupedTransactionsClass] || Boolean)
  async getTransactionsToCategorize(
    @Ctx() context: MyContext
  ): Promise<IGroupedTransactionsClass[] | Boolean> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]!);
    if (!userId) {
      return false;
    }
    try {
      console.log(userId);
      const transactions = await TransactionEntity.find({
        where: { userId },
        relations: ["category", "subCategory"],
      });

      if (transactions.length === 0) {
        return false;
      }

      let groupedTransactions: IGroupedTransactionsMap = {};
      transactions.forEach((transaction) => {
        const keyName = transaction.keyName(transaction);
        if (Object.keys(groupedTransactions).includes(keyName)) {
          groupedTransactions[keyName].ids.push(transaction.id);
          groupedTransactions[keyName].amounts.push(transaction.amount);
          groupedTransactions[keyName].averageAmount =
            groupedTransactions[keyName].amounts.reduce((acc, cur) => {
              return (acc += cur);
            }) / groupedTransactions[keyName].amounts.length;
        } else {
          groupedTransactions[keyName] = {
            id: keyName,
            name: transaction.name,
            memo: transaction.memo,
            amounts: [transaction.amount],
            averageAmount: transaction.amount,
            subCategoryName: transaction.subCategory.name,
            categoryName: transaction.category.name,
            ids: [transaction.id],
          };
        }
      });

      const arrayedGroupedTransactions: IGroupedTransactionsClass[] = [];
      Object.keys(groupedTransactions).forEach((keyName) => {
        arrayedGroupedTransactions.push(groupedTransactions[keyName]);
      });

      const data = arrayedGroupedTransactions
        .sort((a: IGroupedTransactionsClass, b: IGroupedTransactionsClass) => {
          if (b.ids.length < a.ids.length) return -1;
          if (a.ids.length > b.ids.length) return 1;
          return 0;
        })
        .filter(
          (trans: IGroupedTransactionsClass) =>
            trans.categoryName === "uncategorized"
        )
        .slice(0, 10);

      console.log("TR 170: ", data[0]);

      return data;

      //console.log("TR 113: grouped transactions", arrayedGroupedTransactions);

      // console.log(
      //   transactions[0].keyName(transactions[0]),
      //   transactions[0].category.name,
      //   transactions[0].subCategory.name
      // );
    } catch (err) {
      console.log(err);
      return false;
    }
    return false;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async updateCategoriesInTransaction(
    @Arg("data")
    { ids, categoryId, subCategoryId }: updateTransactionInput,
    @Ctx() context: MyContext
  ): Promise<Boolean> {
    const userId = getUserIdFromHeader(context.req.headers["authorization"]!);
    if (!userId) {
      return false;
    }

    try {
      ids.forEach(async (id) => {
        try {
          await TransactionEntity.update(id, {
            categoryId,
            subCategoryId,
          });
          return true;
        } catch (err) {
          console.log("error inserting id: ", id);
          return false;
        }
      });

      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
}
